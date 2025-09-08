import type { RenderLog } from "lib/render-logging/RenderLog"
import type { ManualEditEvent } from "@tscircuit/props"
import type { CircuitJson } from "circuit-json"

export type TabId =
  | "code"
  | "pcb"
  | "schematic"
  | "assembly"
  | "cad"
  | "bom"
  | "circuit_json"
  | "errors"
  | "render_log"

export interface PreviewContentProps {
  defaultToFullScreen?: boolean
  code?: string
  fsMap?: Map<string, string> | Record<string, string>
  readOnly?: boolean
  onRunClicked?: () => void
  tsxRunTriggerCount?: number
  errorMessage?: string | null
  errorStack?: string | null
  autoroutingGraphics?: any
  circuitJson: CircuitJson | null
  className?: string
  showCodeTab?: boolean
  showRenderLogTab?: boolean
  codeTabContent?: React.ReactNode
  showJsonTab?: boolean
  showToggleFullScreen?: boolean
  showImportAndFormatButtons?: boolean
  headerClassName?: string
  /**
   * A record of component name to autorouting information
   */
  autoroutingLog?: Record<string, { simpleRouteJson: any }>
  /**
   * An optional left-side header, you can put a save button, a run button, or
   * a title here.
   */
  leftHeaderContent?: React.ReactNode
  /**
   * Default header content, shown on the right side of the header with the PCB,
   * schematic, and CAD tabs.
   */
  showRightHeaderContent?: boolean
  isRunningCode?: boolean
  isStreaming?: boolean
  // manualEditsFileContent?: string
  hasCodeChangedSinceLastRun?: boolean
  // onManualEditsFileContentChange?: (newmanualEditsFileContent: string) => void

  defaultActiveTab?: TabId

  /**
   * Alias for defaultActiveTab
   */
  defaultTab?: TabId

  /**
   * Tabs to display. Defaults to all
   */
  availableTabs?: TabId[]

  renderLog?: RenderLog | null

  /**
   * Name of the currently running async effect from @tscircuit/core, if any
   */
  activeEffectName?: string

  onEditEvent?: (editEvent: ManualEditEvent) => void
  editEvents?: ManualEditEvent[]

  onActiveTabChange?: (tab: TabId) => any

  autoRotate3dViewerDisabled?: boolean

  showSchematicDebugGrid?: boolean

  onReportAutoroutingLog?: (
    name: string,
    data: { simpleRouteJson: any },
  ) => void

  /**
   * Enable selecting older @tscircuit/eval versions
   */
  allowSelectingVersion?: boolean

  /**
   * Whether to show the file menu
   */
  showFileMenu?: boolean

  /**
   * Whether the preview is being embedded in a web page
   */
  isWebEmbedded?: boolean

  /**
   * Callback to rerun render with debug options
   */
  onRerunWithDebug?: (debugOption: string) => void
}
