import type { CircuitJson } from "circuit-json"
import type { TabId } from "../CircuitJsonPreview/PreviewContentProps"
import type { ReactNode } from "react"

export interface RunFrameStaticBuildViewerProps {
  /**
   * URL or path to the directory containing prebuilt circuit JSON files
   */
  buildDirectoryUrl: string
  
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
  onCircuitJsonLoaded?: (circuitJson: CircuitJson) => void
}
