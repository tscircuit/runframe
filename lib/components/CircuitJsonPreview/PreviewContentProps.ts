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
  readOnly?: boolean
  onRunClicked?: () => void
  tsxRunTriggerCount?: number
  errorMessage?: string | null
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

  renderLog?: RenderLog | null

  onEditEvent?: (editEvent: ManualEditEvent) => void
  editEvents?: ManualEditEvent[]

  onActiveTabChange?: (tab: TabId) => any

  autoRotate3dViewerDisabled?: boolean

  showSchematicDebugGrid?: boolean

  onReportAutoroutingLog?: (
    name: string,
    data: { simpleRouteJson: any },
  ) => void
}
