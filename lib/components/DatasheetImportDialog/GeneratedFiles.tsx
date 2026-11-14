import { Download, FileCode2, Folder } from "lucide-react"
import type { DatasheetGeneration } from "../../ai/datasheet-generation"
export const GeneratedFiles = ({
  generation,
  selectedPath,
  onSelectPath,
  onDownload,
  downloading,
}: {
  generation: DatasheetGeneration
  selectedPath: string
  onSelectPath: (path: string) => void
  onDownload: () => void
  downloading: boolean
}) => {
  const files = Object.entries(generation.files)
  const sourcePath = files.some(([path]) => path === selectedPath)
    ? selectedPath
    : files[0]?.[0]
  return (
    <>
      <div className="ds-folder-bar">
        <Folder size={14} />
        <span title={generation.directory}>{generation.directory}</span>
        <button
          type="button"
          className="ds-icon-button"
          onClick={onDownload}
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
              onClick={() => onSelectPath(path)}
            >
              <FileCode2 size={14} />
              <span title={path.split("/").at(-1)}>
                {path.split("/").at(-1)}
              </span>
            </button>
          ))}
        </nav>
        <pre aria-label="File source" tabIndex={0}>
          <code>{sourcePath ? generation.files[sourcePath] : ""}</code>
        </pre>
      </div>
    </>
  )
}
