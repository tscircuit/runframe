import type { CircuitJson } from "circuit-json"
import type { TabId } from "../CircuitJsonPreview/PreviewContentProps"
import type { ReactNode } from "react"

export interface RunFrameStaticBuildViewerProps {
  /**
   * Map of file paths to circuit JSON objects for multiple file support
   */
  circuitJsonFsMap: Map<string, CircuitJson>
  
  /**
   * Default filename to load initially (defaults to "circuit.json")
   */
  defaultFilename?: string
  
  /**
   * Optional debug mode
   */
  debug?: boolean
  
  /**
   * Optional scenario selector content to display in the header
   */
  scenarioSelectorContent?: ReactNode
  
  /**
   * Default tab to show on initial load
   */
  defaultActiveTab?: TabId
  
  /**
   * Whether to default to full screen mode
   */
  defaultToFullScreen?: boolean
  
  /**
   * Whether to show the toggle fullscreen button
   */
  showToggleFullScreen?: boolean
  
  /**
   * Callback when circuit JSON is loaded
   */
  onCircuitJsonLoaded?: (circuitJson: CircuitJson, filename: string) => void
  
  /**
   * Callback when file selection changes
   */
  onFileChange?: (filename: string, circuitJson: CircuitJson) => void
}
