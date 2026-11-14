import { useEffect, useId, useRef, useState } from "react"
import { useRunFrameAi } from "../../ai/RunFrameAiProvider"
import {
  type DatasheetAssets,
  type DatasheetClarification,
  datasheetAssetLabels,
  getDatasheetAssetFiles,
} from "../../ai/datasheet-assets"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"

export interface DatasheetImportDialogProps {
  isOpen: boolean
  onClose: () => void
  /** Called only after the user reviews and chooses Use generated files. */
  onAssetsGenerated?: (assets: DatasheetAssets) => void | Promise<void>
}

export const DatasheetImportDialog = ({
  isOpen,
  onClose,
  onAssetsGenerated,
}: DatasheetImportDialogProps) => {
  useStyles()
  const ai = useRunFrameAi()
  const id = useId()
  const [file, setFile] = useState<File | null>(null)
  const [targetPart, setTargetPart] = useState("")
  const [assets, setAssets] = useState<DatasheetAssets | null>(null)
  const [clarification, setClarification] =
    useState<DatasheetClarification | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const request = useRef<AbortController | null>(null)
  const saving = useRef(false)
  const session = useRef(0)

  const invalidate = () => {
    session.current++
    request.current?.abort()
    request.current = null
    setIsGenerating(false)
  }

  useEffect(() => {
    // A changed model or a closed dialog invalidates pending results.
    invalidate()
    setAssets(null)
    setClarification(null)
    setError(null)
    setFile(null)
    setTargetPart("")
    return () => {
      session.current++
      request.current?.abort()
      request.current = null
    }
  }, [isOpen, ai?.model])

  const close = () => {
    if (saving.current) return
    invalidate()
    onClose()
  }

  const selectFile = (files: FileList | File[]) => {
    if (saving.current) return
    invalidate()
    setAssets(null)
    setClarification(null)
    setError(null)
    setFile(null)
    try {
      if (files.length !== 1)
        throw new Error("Choose one PDF datasheet at a time.")
      validateDatasheetFile(files[0])
      setFile(files[0])
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not read the datasheet.",
      )
    }
  }

  const generate = async () => {
    if (!ai || !file || request.current || saving.current) return
    const controller = new AbortController()
    request.current = controller
    setIsGenerating(true)
    setAssets(null)
    setClarification(null)
    setError(null)
    try {
      const result = await generateDatasheetAssets({
        ai,
        file,
        targetPart,
        abortSignal: controller.signal,
      })
      if (request.current === controller) {
        const { clarification: nextClarification, ...generated } = result
        setClarification(nextClarification ?? null)
        setAssets(nextClarification ? null : generated)
      }
    } catch (error) {
      if (!controller.signal.aborted && request.current === controller) {
        setError(
          error instanceof Error
            ? error.message
            : "Generation failed. Please try again.",
        )
      }
    } finally {
      if (request.current === controller) {
        request.current = null
        setIsGenerating(false)
      }
    }
  }

  const accept = async () => {
    if (!assets || !onAssetsGenerated || saving.current) return
    saving.current = true
    setIsSaving(true)
    setError(null)
    const currentSession = session.current
    try {
      await onAssetsGenerated(assets)
      if (session.current === currentSession) onClose()
    } catch (error) {
      if (session.current === currentSession) {
        setError(
          error instanceof Error
            ? error.message
            : "Could not save generated files.",
        )
      }
    } finally {
      saving.current = false
      setIsSaving(false)
    }
  }

  const download = async () => {
    if (!assets || isDownloading) return
    const currentSession = session.current
    setIsDownloading(true)
    setError(null)
    try {
      const { default: JSZip } = await import("jszip")
      const zip = new JSZip()
      for (const asset of getDatasheetAssetFiles(assets)) {
        zip.file(asset.filename, asset.content)
      }
      zip.file("datasheet-generation.json", JSON.stringify(assets, null, 2))
      const blob = await zip.generateAsync({ type: "blob" })
      if (session.current !== currentSession) return
      openForDownload(blob, {
        fileName: `${assets.partNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}-assets.zip`,
      })
    } catch (error) {
      if (session.current === currentSession) {
        setError(
          error instanceof Error
            ? error.message
            : "Could not download generated files.",
        )
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const files = assets ? getDatasheetAssetFiles(assets) : []

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <DialogContent className="!rf-w-[calc(100vw-2rem)] !rf-max-w-3xl rf-grid-cols-1 rf-max-h-[90vh] rf-overflow-y-auto !rf-z-[102]">
        <DialogHeader>
          <DialogTitle>Create from datasheet</DialogTitle>
          <DialogDescription>
            AI generates a footprint, symbol, component and behavioral SPICE
            model from your PDF. Review pin mapping, dimensions and model
            approximations before use.
          </DialogDescription>
        </DialogHeader>
        {!ai ? (
          <output>
            AI is not configured. Ask the host app to provide an AI model.
          </output>
        ) : (
          <>
            <div
              className="rf-rounded-lg rf-border-2 rf-border-dashed rf-border-zinc-300 rf-p-6 rf-space-y-2"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                selectFile(event.dataTransfer.files)
              }}
            >
              <label
                htmlFor={`${id}-pdf`}
                className="rf-block rf-text-sm rf-font-medium"
              >
                Drop a PDF datasheet here, or choose a file (up to 20 MB)
              </label>
              <input
                id={`${id}-pdf`}
                type="file"
                className="rf-max-w-full rf-text-sm"
                accept="application/pdf,.pdf"
                disabled={isSaving}
                onChange={(event) => {
                  if (event.target.files?.length) selectFile(event.target.files)
                  event.target.value = ""
                }}
              />
              {file && <p className="rf-text-sm">Selected: {file.name}</p>}
            </div>
            <label htmlFor={`${id}-part`} className="rf-text-sm rf-space-y-1">
              <span className="rf-block">Part number and package</span>
              <input
                id={`${id}-part`}
                aria-describedby={`${id}-part-help`}
                className="rf-w-full rf-rounded rf-border rf-p-2"
                placeholder="e.g. LM358, SOIC-8"
                maxLength={200}
                value={targetPart}
                disabled={isGenerating || isSaving}
                onChange={(event) => {
                  setTargetPart(event.target.value)
                  setAssets(null)
                  setError(null)
                }}
              />
            </label>
            <p id={`${id}-part-help`} className="rf-text-xs rf-text-zinc-500">
              Leave blank to identify the part. If the PDF covers several
              variants or packages, choose one before generating files.
            </p>
            {clarification && (
              <fieldset
                className="rf-grid rf-gap-3 rf-rounded rf-border rf-border-blue-200 rf-bg-blue-50 rf-p-4"
                disabled={isGenerating || isSaving}
              >
                <legend className="rf-px-1 rf-font-semibold">
                  Choose a part and package
                </legend>
                <p className="rf-text-sm">{clarification.question}</p>
                <div className="rf-grid rf-max-h-64 rf-gap-2 rf-overflow-y-auto">
                  {clarification.options.map((option, index) => {
                    const selection = `${option.partNumber}, ${option.packageName}`
                    return (
                      <label
                        key={index}
                        className="rf-flex rf-cursor-pointer rf-items-start rf-gap-3 rf-rounded rf-border rf-bg-white rf-p-3 rf-text-sm"
                      >
                        <input
                          type="radio"
                          name={`${id}-variant`}
                          value={selection}
                          checked={targetPart === selection}
                          onChange={() => {
                            setTargetPart(selection)
                            setAssets(null)
                            setError(null)
                          }}
                        />
                        <span>
                          <strong>
                            {option.partNumber} — {option.packageName}
                          </strong>
                          <span className="rf-block">{option.description}</span>
                          {option.sourcePages.length > 0 && (
                            <span className="rf-block rf-text-xs rf-text-zinc-500">
                              PDF pages {option.sourcePages.join(", ")}
                            </span>
                          )}
                        </span>
                      </label>
                    )
                  })}
                </div>
                <p className="rf-text-xs">
                  Or enter another part and package above. Your PDF is still
                  selected; generate after choosing the variant you need.
                </p>
              </fieldset>
            )}
            <p className="rf-text-xs rf-text-zinc-500">
              Generate sends this PDF to the AI service configured by your host
              app.
            </p>
            <div className="rf-flex rf-flex-wrap rf-gap-2 rf-items-center">
              <Button
                onClick={generate}
                disabled={
                  !file ||
                  isGenerating ||
                  isSaving ||
                  (!!clarification && !targetPart.trim())
                }
              >
                {isGenerating
                  ? "Generating…"
                  : clarification
                    ? "Generate selected part"
                    : assets
                      ? "Generate again"
                      : "Generate assets"}
              </Button>
              {isGenerating && (
                <>
                  <output className="rf-text-sm">
                    Reading datasheet and generating files…
                  </output>
                  <Button variant="outline" onClick={invalidate}>
                    Cancel generation
                  </Button>
                </>
              )}
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="rf-text-sm rf-text-red-600 rf-break-words">
            {error}
          </p>
        )}
        {assets && !clarification && (
          <section
            className="rf-space-y-3 rf-break-words"
            aria-label="Generated assets"
          >
            <h3 className="rf-font-semibold">
              {files.length > 0
                ? `${assets.partNumber} ${assets.packageName}`
                : "No assets generated"}
            </h3>
            <p className="rf-text-sm">{assets.summary}</p>
            {assets.warnings.length > 0 && (
              <ul
                aria-label="Generation warnings"
                className="rf-list-disc rf-pl-5 rf-text-sm rf-text-amber-700"
              >
                {assets.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            )}
            {files.length > 0 &&
              Object.entries(datasheetAssetLabels).map(([kind, label]) => {
                const asset = assets[kind as keyof typeof datasheetAssetLabels]
                return asset ? (
                  <details key={kind} className="rf-rounded rf-border rf-p-3">
                    <summary className="rf-cursor-pointer rf-text-sm rf-font-medium">
                      {label}: {asset.filename}
                    </summary>
                    <p className="rf-my-2 rf-text-xs">{asset.notes}</p>
                    <p className="rf-text-xs rf-text-zinc-500">
                      Source pages:{" "}
                      {asset.sourcePages.join(", ") || "Not supplied"}
                    </p>
                    <pre className="rf-mt-2 rf-max-h-64 rf-overflow-auto rf-bg-zinc-100 rf-p-3 rf-text-xs">
                      <code>{asset.content}</code>
                    </pre>
                  </details>
                ) : (
                  <p key={kind} className="rf-text-sm rf-text-zinc-500">
                    {label}: unavailable from this datasheet
                  </p>
                )
              })}
          </section>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={isSaving}>
            Close
          </Button>
          {files.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={download}
                disabled={isDownloading || isSaving}
              >
                {isDownloading ? "Preparing download…" : "Download ZIP"}
              </Button>
              {onAssetsGenerated && (
                <Button onClick={accept} disabled={isSaving}>
                  {isSaving ? "Saving…" : "Use generated files"}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
