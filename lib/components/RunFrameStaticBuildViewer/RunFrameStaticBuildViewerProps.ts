import type { CircuitJson } from "circuit-json"
import type { TabId } from "../CircuitJsonPreview/PreviewContentProps"
import type { ReactNode } from "react"

export interface RunFrameStaticBuildViewerProps {
  circuitJsonFiles: Record<string, CircuitJson>
  defaultFilename?: string
  debug?: boolean
  scenarioSelectorContent?: ReactNode
  defaultActiveTab?: TabId
  defaultToFullScreen?: boolean
  showToggleFullScreen?: boolean
  onCircuitJsonLoaded?: (circuitJson: CircuitJson, filename: string) => void
  onFileChange?: (filename: string, circuitJson: CircuitJson) => void
  onExport?: (format: string, filename: string) => void
  showFileSelector?: boolean
  showFileMenu?: boolean
  exportFormats?: string[]
  className?: string
}
