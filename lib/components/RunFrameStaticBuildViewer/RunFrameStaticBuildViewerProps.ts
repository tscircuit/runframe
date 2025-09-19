import type { CircuitJson } from "circuit-json"
import type { TabId } from "../CircuitJsonPreview/PreviewContentProps"
import type { ReactNode } from "react"

/**
 * Props for the RunFrameStaticBuildViewer component
 * 
 * This component provides a static viewer for circuit JSON files with support for
 * multiple file selection, export functionality, and customizable UI elements.
 */
export interface RunFrameStaticBuildViewerProps {
  /** Record of filename to CircuitJson data for static loading */
  circuitJsonFiles: Record<string, CircuitJson>
  /** Default filename to load initially */
  defaultFilename?: string
  /** Whether to enable debug mode */
  debug?: boolean
  /** Optional content to display in the scenario selector area */
  scenarioSelectorContent?: ReactNode
  /** Default active tab when the component loads */
  defaultActiveTab?: TabId
  /** Whether to start in full-screen mode */
  defaultToFullScreen?: boolean
  /** Whether to show the toggle full-screen button */
  showToggleFullScreen?: boolean
  /** Callback when circuit JSON is loaded */
  onCircuitJsonLoaded?: (circuitJson: CircuitJson, filename: string) => void
  /** Callback when file selection changes */
  onFileChange?: (filename: string, circuitJson: CircuitJson) => void
  /** Callback when export is triggered */
  onExport?: (format: string, filename: string) => void
  /** Whether to show the file selector */
  showFileSelector?: boolean
  /** Whether to show the file menu */
  showFileMenu?: boolean
  /** Available export formats */
  exportFormats?: string[]
  /** Optional className for styling */
  className?: string
}
