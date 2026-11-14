import { useEffect, useId, useRef, useState } from "react"
import {
  Activity,
  Check,
  CircuitBoard,
  Cpu,
  Download,
  FileCode2,
  FileText,
  Folder,
  Loader2,
  Upload,
  X,
} from "lucide-react"
import { useRunFrameAi } from "../../ai/RunFrameAiProvider"
import {
  type DatasheetAssets,
  type DatasheetAssetSelection,
  type DatasheetUsageKind,
} from "../../ai/datasheet-assets"
import {
  createDatasheetGeneration,
  saveDatasheetGenerationToApi,
  type DatasheetGeneration,
} from "../../ai/datasheet-generation"
import {
  generateDatasheetAssets,
  validateDatasheetFile,
} from "../../ai/generate-datasheet-assets"
import { useStyles } from "../../hooks/use-styles"
import { openForDownload } from "../../optional-features/exporting/open-for-download"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog"
import { datasheetDialogStyles } from "./datasheet-dialog-styles"

export interface DatasheetImportDialogProps {
  isOpen: boolean
  onClose: () => void
  /** Save all artifacts before enabling project actions. */
  onGenerationCreated?: (
    generation: DatasheetGeneration,
  ) => void | Promise<void>
  /** Add the saved module to the board; the dialog stays open. */
  onAssetsGenerated?: (
    assets: DatasheetAssets,
    selection?: DatasheetAssetSelection,
  ) => void | Promise<void>
}
type GenerationView = {
  generation: DatasheetGeneration
  saved: boolean
  added: Set<DatasheetUsageKind>
}
const targets = [
  { kind: "component", label: "Chip", icon: Cpu },
  { kind: "simulationCircuit", label: "Simulation circuit", icon: Activity },
  { kind: "referenceCircuit", label: "Reference circuit", icon: CircuitBoard },
] as const

export const DatasheetImportDialog = ({
  isOpen,
  onClose,
  onGenerationCreated,
  onAssetsGenerated,
}: DatasheetImportDialogProps) => {
  useStyles()
  const ai = useRunFrameAi()
  const id = useId()
  const fileInput = useRef<HTMLInputElement>(null)
  const request = useRef<AbortController | null>(null)
  const saving = useRef(false)
  const [file, setFile] = useState<File | null>(null)
  const [simulation, setSimulation] = useState(false)
  const [reference, setReference] = useState(false)
  const [records, setRecords] = useState<GenerationView[]>([])
  const [activeId, setActiveId] = useState("")
  const [tab, setTab] = useState<"components" | "files">("components")
  const [selectedPath, setSelectedPath] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [savingGeneration, setSavingGeneration] = useState(false)
  const [adding, setAdding] = useState<DatasheetUsageKind | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const active = records.find((record) => record.generation.id === activeId)
  const busy = generating || savingGeneration || adding !== null

  const cancel = () => {
    request.current?.abort()
    request.current = null
    setGenerating(false)
  }
  // Retain completed generations and used states when the dialog closes.
  useEffect(() => {
    cancel()
    return () => {
      request.current?.abort()
      request.current = null
    }
  }, [isOpen, ai?.model])
  const close = () => {
    if (saving.current) return
    cancel()
    onClose()
  }
  const selectFile = (files: FileList | File[]) => {
    if (busy || saving.current) return
    setError(null)
    setDragging(false)
    try {
      if (files.length !== 1) throw new Error("Choose one PDF datasheet.")
      validateDatasheetFile(files[0])
      setFile(files[0])
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not open this file.",
      )
    }
  }
  const persist = async (generation: DatasheetGeneration) => {
    saving.current = true
    setSavingGeneration(true)
    setError(null)
    try {
      if (onGenerationCreated) await onGenerationCreated(generation)
      else await saveDatasheetGenerationToApi(generation)
      setRecords((previous) =>
        previous.map((record) =>
          record.generation.id === generation.id
            ? { ...record, saved: true }
            : record,
        ),
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not save generated files.",
      )
    } finally {
      saving.current = false
      setSavingGeneration(false)
    }
  }
  const generate = async () => {
    if (!ai || !file || request.current || saving.current) return
    const controller = new AbortController()
    request.current = controller
    setGenerating(true)
    setError(null)
    try {
      const assets = await generateDatasheetAssets({
        ai,
        file,
        generateSimulationCircuit: simulation,
        generateReferenceCircuit: reference,
        abortSignal: controller.signal,
      })
      if (request.current !== controller) return
      const generation = createDatasheetGeneration(assets, file.name)
      setRecords((previous) => [
        ...previous,
        { generation, saved: false, added: new Set() },
      ])
      setActiveId(generation.id)
      setSelectedPath(Object.keys(generation.files)[0] ?? "")
      setTab("components")
      setGenerating(false)
      await persist(generation)
    } catch (error) {
      if (!controller.signal.aborted && request.current === controller)
        setError(
          error instanceof Error
            ? error.message
            : "Generation failed. Try again.",
        )
    } finally {
      if (request.current === controller) {
        request.current = null
        setGenerating(false)
      }
    }
  }
  const useInProject = async (kind: DatasheetUsageKind) => {
    if (
      !active?.saved ||
      !onAssetsGenerated ||
      busy ||
      saving.current ||
      active.added.has(kind)
    )
      return
    const { generation } = active
    const asset = generation.assets[kind]
    if (!asset) return
    saving.current = true
    setAdding(kind)
    setError(null)
    try {
      await onAssetsGenerated(generation.assets, {
        kind,
        generationId: generation.id,
        directory: generation.directory,
        entrypoint: `${generation.directory}/${asset.filename}`,
      })
      setRecords((previous) =>
        previous.map((record) =>
          record.generation.id === generation.id
            ? { ...record, added: new Set([...record.added, kind]) }
            : record,
        ),
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not add this component. Try again.",
      )
    } finally {
      saving.current = false
      setAdding(null)
    }
  }
  const download = async () => {
    if (!active || downloading) return
    setDownloading(true)
    try {
      const { default: JSZip } = await import("jszip")
      const zip = new JSZip()
      for (const [path, content] of Object.entries(active.generation.files))
        zip.file(path, content)
      openForDownload(await zip.generateAsync({ type: "blob" }), {
        fileName: `${active.generation.assets.partNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}-assets.zip`,
      })
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not download these files.",
      )
    } finally {
      setDownloading(false)
    }
  }
  const files = Object.entries(active?.generation.files ?? {})
  const sourcePath = files.some(([path]) => path === selectedPath)
    ? selectedPath
    : files[0]?.[0]
  const retrySave = active && !active.saved && !busy
  const status =
    error ??
    (savingGeneration
      ? "Saving files…"
      : generating
        ? "Generating…"
        : adding
          ? "Adding to project…"
          : active?.saved
            ? "Saved to project files"
            : file
              ? "Ready to generate"
              : "No file selected")

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <DialogContent
        className="rf-datasheet-dialog"
        overlayClassName="ds-overlay"
        aria-describedby={`${id}-description`}
      >
        <style>{datasheetDialogStyles}</style>
        <header className="ds-header">
          <DialogTitle>Create from datasheet</DialogTitle>
          <DialogDescription id={`${id}-description`} className="rf-sr-only">
            Upload a PDF and add generated components to your board.
          </DialogDescription>
          <button
            type="button"
            className="ds-icon-button"
            onClick={close}
            disabled={savingGeneration || adding !== null}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>
        <div className="ds-controls">
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,.pdf"
            className="rf-sr-only"
            aria-label="PDF datasheet"
            disabled={busy || !ai}
            onChange={(event) => {
              if (event.target.files?.length) selectFile(event.target.files)
              event.target.value = ""
            }}
          />
          <div
            className="ds-upload"
            data-dragging={dragging}
            onDragOver={(event) => {
              event.preventDefault()
              if (!busy) setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              selectFile(event.dataTransfer.files)
            }}
          >
            <button
              type="button"
              className="ds-upload-trigger"
              onClick={() => fileInput.current?.click()}
              disabled={busy || !ai}
              aria-label={file ? `Change PDF: ${file.name}` : "Upload PDF"}
            >
              {file ? <FileText size={20} /> : <Upload size={20} />}
              <span className="ds-upload-name">
                {file?.name ?? "Upload PDF"}
              </span>
              <span className="ds-upload-size">
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
                  : "Up to 20 MB"}
              </span>
            </button>
          </div>
          <div className="ds-options">
            <label>
              <input
                type="checkbox"
                role="switch"
                checked={simulation}
                disabled={busy || !ai}
                onChange={(event) => setSimulation(event.target.checked)}
              />
              <span>Simulation circuit</span>
            </label>
            <label>
              <input
                type="checkbox"
                role="switch"
                checked={reference}
                disabled={busy || !ai}
                onChange={(event) => setReference(event.target.checked)}
              />
              <span>Reference circuit</span>
            </label>
          </div>
        </div>
        <div className="ds-tabs">
          <div
            role="tablist"
            aria-label="Generation view"
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return
              event.preventDefault()
              const next =
                event.key === "Home"
                  ? "components"
                  : event.key === "End"
                    ? "files"
                    : tab === "components"
                      ? "files"
                      : "components"
              setTab(next)
              event.currentTarget
                .querySelectorAll<HTMLButtonElement>('[role="tab"]')
                [next === "components" ? 0 : 1]?.focus()
            }}
          >
            <button
              type="button"
              role="tab"
              id={`${id}-components-tab`}
              tabIndex={tab === "components" ? 0 : -1}
              aria-selected={tab === "components"}
              aria-controls={`${id}-components`}
              onClick={() => setTab("components")}
            >
              Components
            </button>
            <button
              type="button"
              role="tab"
              id={`${id}-files-tab`}
              tabIndex={tab === "files" ? 0 : -1}
              aria-selected={tab === "files"}
              aria-controls={`${id}-files`}
              onClick={() => setTab("files")}
            >
              Files
            </button>
          </div>
          <select
            aria-label="Generation"
            value={activeId}
            disabled={!records.length || busy}
            onChange={(event) => {
              setActiveId(event.target.value)
              setError(null)
            }}
          >
            {!records.length && <option value="">Current generation</option>}
            {records.map((record, index) => (
              <option key={record.generation.id} value={record.generation.id}>
                Generation {index + 1}
              </option>
            ))}
          </select>
        </div>
        <div className="ds-content">
          {!active ? (
            <div className="ds-empty">
              <div className="ds-empty-icon">
                {generating ? (
                  <Loader2 className="ds-spin" size={22} />
                ) : (
                  <FileCode2 size={22} />
                )}
              </div>
              <span>
                {!ai
                  ? "Configure AI to generate components"
                  : generating
                    ? "Generating components…"
                    : "No generation yet"}
              </span>
            </div>
          ) : tab === "components" ? (
            <section
              role="tabpanel"
              id={`${id}-components`}
              aria-label="Generated components"
              className="ds-components"
            >
              <div className="ds-result-heading">
                <strong title={active.generation.assets.partNumber}>
                  {active.generation.assets.partNumber}
                </strong>
                <span title={active.generation.assets.packageName}>
                  {active.generation.assets.packageName}
                </span>
              </div>
              <div className="ds-component-list">
                {targets.map(({ kind, label, icon: Icon }) => {
                  const available = !!active.generation.assets[kind]
                  const added = active.added.has(kind)
                  return (
                    <article
                      key={kind}
                      className="ds-component-row"
                      aria-label={label}
                      data-available={available}
                    >
                      <Icon size={19} className="ds-component-icon" />
                      <span className="ds-component-label">{label}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="ds-use-button"
                        aria-label="Use in project"
                        disabled={
                          !available ||
                          !active.saved ||
                          busy ||
                          added ||
                          !onAssetsGenerated
                        }
                        aria-pressed={added}
                        onClick={() => useInProject(kind)}
                      >
                        <span className="ds-button-icon">
                          {adding === kind ? (
                            <Loader2 size={14} className="ds-spin" />
                          ) : added ? (
                            <Check size={14} aria-label="Added to project" />
                          ) : null}
                        </span>
                        Use in project
                      </Button>
                    </article>
                  )
                })}
              </div>
            </section>
          ) : (
            <section
              role="tabpanel"
              id={`${id}-files`}
              aria-label="Generated files"
              className="ds-files"
            >
              <div className="ds-folder-bar">
                <Folder size={14} />
                <span title={active.generation.directory}>
                  {active.generation.directory}
                </span>
                <button
                  type="button"
                  className="ds-icon-button"
                  onClick={download}
                  disabled={downloading}
                  aria-label="Download generation"
                >
                  <Download size={15} />
                </button>
              </div>
              <div className="ds-file-panes">
                <nav aria-label="Generated file list">
                  {files.map(([path]) => (
                    <button
                      type="button"
                      key={path}
                      aria-current={sourcePath === path ? "true" : undefined}
                      onClick={() => setSelectedPath(path)}
                    >
                      <FileCode2 size={14} />
                      <span title={path.split("/").at(-1)}>
                        {path.split("/").at(-1)}
                      </span>
                    </button>
                  ))}
                </nav>
                <pre aria-label="File source">
                  <code>
                    {sourcePath ? active.generation.files[sourcePath] : ""}
                  </code>
                </pre>
              </div>
            </section>
          )}
        </div>
        <footer className="ds-footer">
          <div
            className="ds-status"
            role={error ? "alert" : "status"}
            data-error={!!error}
          >
            {savingGeneration || generating || adding ? (
              <Loader2 className="ds-spin" size={13} />
            ) : active?.saved && !error ? (
              <Check size={13} />
            ) : null}
            <span>{status}</span>
          </div>
          <div className="ds-footer-actions">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={generating ? "" : "ds-invisible"}
              onClick={cancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="ds-generate-button"
              disabled={!ai || !file || busy}
              onClick={() =>
                retrySave ? persist(active.generation) : generate()
              }
            >
              {retrySave
                ? "Retry save"
                : generating
                  ? "Generating"
                  : "Generate"}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
