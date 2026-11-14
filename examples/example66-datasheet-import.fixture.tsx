import evalWebWorkerBlobUrl from "@tscircuit/eval/blob-url"
import { useEffect, useRef, useState } from "react"
import { FileCode2, Folder } from "lucide-react"
import type { RunFrameAiConfig } from "../lib/ai/RunFrameAiProvider"
import {
  type DatasheetAssets,
  type DatasheetAssetSelection,
  type DatasheetGeneration,
  addDatasheetToBoard,
} from "../lib/ai"
import { RunFrame } from "../lib/components/RunFrame/RunFrame"
import { useStyles } from "../lib/hooks/use-styles"
import packageJson from "../package.json"
import { DatasheetPreviewAiConnection } from "./assets/DatasheetPreviewAiConnection"
import {
  loadDatasheetProjectFiles,
  saveDatasheetProjectFiles,
} from "./assets/datasheet-project-files"

const boardSource = () => `export default () => (
  <board routingDisabled>
    <resistor name="R1" resistance="1k" footprint="0805" pcbX={-6} pcbY={4} schX={-2} schY={1} />
    <resistor name="R2" resistance="10k" footprint="0805" pcbX={6} pcbY={4} schX={2} schY={1} />
    <capacitor name="C1" capacitance="100nF" footprint="0805" pcbX={-6} pcbY={-4} schX={-2} schY={-1} />
    <capacitor name="C2" capacitance="10uF" footprint="1206" pcbX={6} pcbY={-4} schX={2} schY={-1} />
    <trace from=".R1 > .pin2" to=".C1 > .pin1" />
    <trace from=".R2 > .pin2" to=".C2 > .pin1" />
  </board>
)
`

// The website's CodeAndPreview uses SuspenseRunFrame, a thin wrapper around this
// RunFrame export, with showFileMenu={false}, showRunButton and source files.
// https://github.com/tscircuit/tscircuit.com/blob/main/src/components/package-port/CodeAndPreview.tsx
export default function DatasheetImportFixture() {
  useStyles()
  const [files, setFiles] = useState<Record<string, string>>({
    "main.tsx": boardSource(),
  })
  const [selectedFile, setSelectedFile] = useState("main.tsx")
  const [hasRendered, setHasRendered] = useState(false)
  const [ai, setAi] = useState<RunFrameAiConfig | undefined>(undefined)
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [projectError, setProjectError] = useState<string | null>(null)
  const filesRef = useRef(files)
  filesRef.current = files
  useEffect(() => {
    let current = true
    loadDatasheetProjectFiles()
      .then(async (saved) => {
        if (!current) return
        if (!Object.keys(saved).length)
          await saveDatasheetProjectFiles({ "main.tsx": boardSource() })
        if (current && Object.keys(saved).length) setFiles(saved)
      })
      .catch((error) => {
        if (current) setProjectError(error.message)
      })
      .finally(() => {
        if (current) setLoadingFiles(false)
      })
    return () => {
      current = false
    }
  }, [])
  const saveGeneration = async (generation: DatasheetGeneration) => {
    await saveDatasheetProjectFiles(generation.files)
    setFiles((previous) => ({ ...previous, ...generation.files }))
  }
  const acceptAssets = async (
    _assets: DatasheetAssets,
    selection?: DatasheetAssetSelection,
  ) => {
    if (!selection) return
    const updated = await addDatasheetToBoard({
      source: filesRef.current["main.tsx"],
      boardPath: "main.tsx",
      selection,
    })
    await saveDatasheetProjectFiles({ "main.tsx": updated })
    setFiles((previous) => ({ ...previous, "main.tsx": updated }))
  }
  const generatedFolders = Array.from(
    new Set(
      Object.keys(files)
        .filter((path) => path.startsWith("generated/"))
        .map((path) => path.split("/").slice(0, 2).join("/")),
    ),
  )
  const fileButton = (path: string) => (
    <button
      type="button"
      key={path}
      title={path}
      aria-pressed={path === selectedFile}
      onClick={() => setSelectedFile(path)}
    >
      <FileCode2 size={13} />
      <span>{path.split("/").at(-1)}</span>
    </button>
  )

  return (
    <div className="datasheet-website-fixture">
      <style>{`
        .datasheet-website-fixture { height: 100dvh; display: flex; flex-direction: column; color: #18181b; background: #fff; font-family: ui-sans-serif, system-ui, sans-serif; }
        .datasheet-website-fixture .workspace-heading { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid #e4e4e7; font-size: 14px; }
        .datasheet-website-fixture .workspace-panes { display: grid; grid-template-columns: minmax(260px, 0.38fr) minmax(0, 0.62fr); flex: 1; min-height: 0; }
        .datasheet-website-fixture .code-pane { display: grid; grid-template-columns: 170px minmax(0,1fr); min-height: 0; border-right: 1px solid #e4e4e7; background: #fafafa; }
        .datasheet-website-fixture .file-tree { min-width:0; overflow:auto; padding:8px; border-right:1px solid #e4e4e7; font-size:11px; }
        .datasheet-website-fixture .file-tree h2 { margin:0 0 8px; padding:5px 6px; font-size:11px; font-weight:600; color:#71717a; }
        .datasheet-website-fixture .file-tree button { display:flex; align-items:center; gap:6px; width:100%; height:29px; padding:0 7px; border:0; border-radius:4px; background:transparent; color:#52525b; text-align:left; font-size:11px; cursor:pointer; }
        .datasheet-website-fixture .file-tree button span { white-space:nowrap; text-overflow:ellipsis; overflow:hidden; }
        .datasheet-website-fixture .file-tree button svg { flex-shrink:0; }
        .datasheet-website-fixture .file-tree button[aria-pressed=true] { color:#18181b; background:#eaeaec; }
        .datasheet-website-fixture .file-tree summary { cursor:pointer; padding:7px 4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#71717a; }
        .datasheet-website-fixture .file-tree details>div { padding-left:9px; }
        .datasheet-website-fixture .source-pane { display:flex; flex-direction:column; min-height:0; min-width:0; }
        .datasheet-website-fixture .source-path { height:36px; flex:none; border-bottom:1px solid #e4e4e7; padding:10px 16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:11px; color:#71717a; }
        .datasheet-website-fixture .code-pane textarea { width: 100%; flex: 1; min-height: 0; resize: none; border: 0; outline-offset: -2px; padding: 16px; font: 12px/1.8 ui-monospace, SFMono-Regular, monospace; background: transparent; }
        .datasheet-website-fixture .tscircuit-runframe { height: 100%; min-height: 0; overflow: hidden; }
        .datasheet-website-fixture .tscircuit-runframe [role=tabpanel][data-state=active], .datasheet-website-fixture .tscircuit-runframe [role=tabpanel][data-state=active] > div { min-height: 0 !important; }
        @media (max-width: 800px) { .datasheet-website-fixture .workspace-panes { grid-template-columns: minmax(0, 1fr); } .datasheet-website-fixture .code-pane { display: none; } }
      `}</style>
      <header className="workspace-heading">
        <strong style={{ fontSize: 18, letterSpacing: -0.5 }}>tscircuit</strong>
        <span style={{ color: "#71717a" }}>examples /</span>
        <span>datasheet-demo</span>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: "#71717a", fontSize: 12 }}>
            {ai ? "AI configured" : "AI not configured"}
          </span>
          <DatasheetPreviewAiConnection isConfigured={!!ai} onChange={setAi} />
        </div>
      </header>
      {projectError && (
        <p
          role="alert"
          style={{
            margin: 0,
            padding: "8px 20px",
            color: "#b42318",
            fontSize: 12,
          }}
        >
          {projectError}
        </p>
      )}
      <main className="workspace-panes">
        <section className="code-pane" aria-label="Project files">
          <nav className="file-tree" aria-label="Files">
            <h2>Files</h2>
            {fileButton("main.tsx")}
            {generatedFolders.map((folder) => (
              <details key={folder} open>
                <summary title={folder}>
                  <Folder
                    size={12}
                    style={{ display: "inline", marginRight: 5 }}
                  />
                  {folder.split("/").at(-1)}
                </summary>
                <div>
                  {Object.keys(files)
                    .filter((path) => path.startsWith(folder + "/"))
                    .map(fileButton)}
                </div>
              </details>
            ))}
          </nav>
          <div className="source-pane">
            <div className="source-path" title={selectedFile}>
              {selectedFile}
            </div>
            <textarea
              aria-label={`${selectedFile} source`}
              spellCheck={false}
              value={files[selectedFile]}
              onChange={(event) =>
                setFiles((previous) => ({
                  ...previous,
                  [selectedFile]: event.target.value,
                }))
              }
            />
          </div>
        </section>
        <section className="tscircuit-runframe" aria-label="Circuit preview">
          <RunFrame
            fsMap={files}
            mainComponentPath="main.tsx"
            showFileMenu={false}
            showRunButton={hasRendered}
            onRenderFinished={() => setHasRendered(true)}
            isWebEmbedded
            defaultActiveTab="cad"
            availableTabs={[
              "pcb",
              "schematic",
              "cad",
              "analog_simulation",
              "errors",
            ]}
            evalVersion={packageJson.dependencies["@tscircuit/eval"]}
            evalWebWorkerBlobUrl={evalWebWorkerBlobUrl}
            ai={ai}
            onDatasheetAssetsGenerated={acceptAssets}
            onDatasheetGenerationCreated={saveGeneration}
            isLoadingFiles={loadingFiles}
          />
        </section>
      </main>
    </div>
  )
}
