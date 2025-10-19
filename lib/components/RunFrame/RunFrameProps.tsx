import type { ManualEditEvent } from "@tscircuit/props"
import type { TabId } from "lib/components/CircuitJsonPreview/PreviewContentProps"

export interface RunFrameProps {
  /**
   * Map of filenames to file contents that will be available in the worker
   */
  fsMap: Map<string, string> | Record<string, string>

  /**
   * When true, indicates the file map is still loading and a loading state
   * should be displayed instead of attempting to execute any code.
   */
  isLoadingFiles?: boolean

  /**
   * The entry point file that will be executed first. If not provided,
   * @tscircuit/eval will infer the entrypoint
   */
  entrypoint?: string

  /**
   * The path to the main component that should be rendered. If not provided,
   * the default component from the entry point will be used.
   */
  mainComponentPath?: string

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
  defaultToFullScreen?: boolean

  /**
   * An optional left-side header, you can put a save button, a run button, or
   * a title here.
   */
  leftHeaderContent?: React.ReactNode

  /**
   * Whether the run frame is embedded in a web page
   */
  isWebEmbedded?: boolean

  /**
   * Whether to show the file menu
   */
  showFileMenu?: boolean

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

  /**
   * Alias for defaultActiveTab
   */
  defaultTab?: TabId

  /**
   * Tabs to display. Defaults to all
   */
  availableTabs?: TabId[]

  evalWebWorkerBlobUrl?: string

  evalVersion?: string
  forceLatestEvalVersion?: boolean

  /**
   * Optional project URL whose pathname will be used when
   * reporting autorouting bugs
   */
  projectUrl?: string

  onReportAutoroutingLog?: (
    name: string,
    data: { simpleRouteJson: any },
  ) => void

  /**
   * Enable fetch proxy for the web worker (useful for standalone bundles)
   */
  enableFetchProxy?: boolean
  /**
   * Whether to auto-render on edit
   */
  autoRenderOnEdit?: boolean
}
