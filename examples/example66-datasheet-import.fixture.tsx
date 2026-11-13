import evalWebWorkerBlobUrl from "@tscircuit/eval/blob-url"
import { useState } from "react"
import type { RunFrameAiConfig } from "../lib/ai/RunFrameAiProvider"
import {
  type DatasheetAssets,
  getDatasheetAssetFiles,
} from "../lib/ai/datasheet-assets"
import { RunFrame } from "../lib/components/RunFrame/RunFrame"
import { useStyles } from "../lib/hooks/use-styles"
import packageJson from "../package.json"
import { DatasheetPreviewAiConnection } from "./assets/DatasheetPreviewAiConnection"

const boardSource = (
  componentFilename?: string,
) => `${componentFilename ? `import DatasheetComponent from "./${componentFilename.replace(/\.tsx$/, "")}"\n\n` : ""}export default () => (
  <board width="30mm" height="22mm">
    <resistor name="R1" resistance="1k" footprint="0805" pcbX={-6} pcbY={4} schX={-2} schY={1} />
    <resistor name="R2" resistance="10k" footprint="0805" pcbX={6} pcbY={4} schX={2} schY={1} />
    <capacitor name="C1" capacitance="100nF" footprint="0805" pcbX={-6} pcbY={-4} schX={-2} schY={-1} />
    <capacitor name="C2" capacitance="10uF" footprint="1206" pcbX={6} pcbY={-4} schX={2} schY={-1} />
    <trace from=".R1 > .pin2" to=".C1 > .pin1" />
    <trace from=".R2 > .pin2" to=".C2 > .pin1" />
    ${componentFilename ? '<DatasheetComponent name="U1" />' : ""}
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
  const [acceptedPart, setAcceptedPart] = useState<string | null>(null)
  const [hasRendered, setHasRendered] = useState(false)
  const [ai, setAi] = useState<RunFrameAiConfig | undefined>(undefined)

  const acceptAssets = (assets: DatasheetAssets) => {
    const generated = getDatasheetAssetFiles(assets)
    for (const file of generated) {
      if (file.filename in files)
        throw new Error(`File already exists: ${file.filename}`)
    }
    setFiles((previous) => ({
      ...previous,
      ...Object.fromEntries(
        generated.map((file) => [file.filename, file.content]),
      ),
      "main.tsx": boardSource(assets.component?.filename),
    }))
    setAcceptedPart(assets.partNumber)
  }

  return (
    <div className="datasheet-website-fixture">
      <style>{`
        .datasheet-website-fixture { height: 100dvh; display: flex; flex-direction: column; color: #18181b; background: #fff; font-family: ui-sans-serif, system-ui, sans-serif; }
        .datasheet-website-fixture .workspace-heading { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid #e4e4e7; font-size: 14px; }
        .datasheet-website-fixture .workspace-panes { display: grid; grid-template-columns: minmax(260px, 0.38fr) minmax(0, 0.62fr); flex: 1; min-height: 0; }
        .datasheet-website-fixture .code-pane { display: flex; flex-direction: column; min-height: 0; border-right: 1px solid #e4e4e7; background: #fafafa; }
        .datasheet-website-fixture .file-tabs { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px; border-bottom: 1px solid #e4e4e7; }
        .datasheet-website-fixture .file-tabs button { padding: 6px 10px; border-radius: 4px; font-size: 12px; }
        .datasheet-website-fixture .file-tabs button[aria-pressed=true] { color: #1d4ed8; background: #dbeafe; }
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
      {!ai && (
        <output
          style={{
            padding: "8px 20px",
            background: "#fffbeb",
            color: "#92400e",
            fontSize: 13,
          }}
        >
          Configure a real AI backend to create assets from your datasheet. This
          preview has no simulated generation.
        </output>
      )}
      <main className="workspace-panes">
        <section className="code-pane" aria-label="Project files">
          <nav className="file-tabs" aria-label="Files">
            {Object.keys(files).map((filename) => (
              <button
                type="button"
                key={filename}
                aria-pressed={filename === selectedFile}
                onClick={() => setSelectedFile(filename)}
              >
                {filename}
              </button>
            ))}
          </nav>
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
          {acceptedPart && (
            <output
              style={{ padding: "10px 16px", fontSize: 12, color: "#15803d" }}
            >
              Added {acceptedPart} to project files. Run to update the preview.
            </output>
          )}
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
            availableTabs={["pcb", "schematic", "cad", "errors"]}
            evalVersion={packageJson.dependencies["@tscircuit/eval"]}
            evalWebWorkerBlobUrl={evalWebWorkerBlobUrl}
            ai={ai}
            onDatasheetAssetsGenerated={acceptAssets}
          />
        </section>
      </main>
    </div>
  )
}
