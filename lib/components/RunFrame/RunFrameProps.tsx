import type { ManualEditEvent } from "@tscircuit/props"
import type { TabId } from "lib/components/CircuitJsonPreview/PreviewContentProps"

export interface RunFrameProps {
  /**
   * Map of filenames to file contents that will be available in the worker
   */
  fsMap: Map<string, string> | Record<string, string>

  /**
   * The entry point file that will be executed first
   */
  entrypoint: string

  /**
   * Whether to show a run button that controls when code executes
   */
  showRunButton?: boolean

  /**
   * Whether to show a full screen button
   */
  showToggleFullScreen?: boolean

  /**
   * Whether to expand the preview to fill the available space by default
   */
  defaultToFullScreen?: boolean;

  /**
   * An optional left-side header, you can put a save button, a run button, or
   * a title here.
   */
  leftHeaderContent?: React.ReactNode

  /**
   * Called when the circuit JSON changes
   */
  onCircuitJsonChange?: (circuitJson: any) => void

  /**
   * Called when rendering is finished
   */
  onRenderFinished?: (params: { circuitJson: any }) => void

  /**
   * Called when the initial render is finished (fast)
   */
  onInitialRender?: (params: { circuitJson: any }) => void

  /**
   * Called when rendering is started
   */
  onRenderStarted?: () => void

  /**
   * Called for each render event
   */
  onRenderEvent?: (event: any) => void

  /**
   * Called when an error occurs
   */
  onError?: (error: Error) => void

  /**
   * Called when an edit event occurs
   */
  onEditEvent?: (editEvent: ManualEditEvent) => void

  /**
   * Any edit events that have occurred and should be applied
   */
  editEvents?: ManualEditEvent[]

  /**
   * If true, turns on debug logging
   */
  debug?: boolean

  defaultActiveTab?: TabId

  evalWebWorkerBlobUrl?: string

  evalVersion?: string
  forceLatestEvalVersion?: boolean

  onReportAutoroutingLog?: (
    name: string,
    data: { simpleRouteJson: any },
  ) => void
}
