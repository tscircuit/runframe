import type { TabId } from "lib/components/CircuitJsonPreview/PreviewContentProps"

/**
 * What the iframe supports beyond evaluating code, sent with its ready
 * message so a host can tell an older deployment from a newer one.
 */
export const RUNFRAME_IFRAME_CAPABILITIES = [
  "show_header",
  "active_tab",
  "render_events",
] as const

export type RunFrameIframeCapability =
  (typeof RUNFRAME_IFRAME_CAPABILITIES)[number]

export type RunFrameIframeReadyMessage = {
  runframe_type: "runframe_ready_to_receive"
  runframe_capabilities?: readonly RunFrameIframeCapability[]
}

/** How many elements of each type a Circuit JSON has, e.g. `{ pcb_board: 1 }`. */
export type CircuitJsonElementCounts = Record<string, number>

export type ErrorEvent = {
  type: "error"
  error_message: string
}

export type FullScreenEvent = {
  type: "toggle_full_screen"
  full_screen_enabled: boolean
}

export type RenderStartedEvent = {
  type: "render_started"
}

/**
 * Sent for the first Circuit JSON of a run, which arrives before routing has
 * finished, and again for the final one.
 */
export type CircuitJsonChangedEvent = {
  type: "circuit_json_changed"
  circuit_json_element_counts: CircuitJsonElementCounts
}

export type RenderFinishedEvent = {
  type: "render_finished"
  circuit_json_element_counts: CircuitJsonElementCounts
}

/** Sent when a run ends, whether it rendered or threw. */
export type RunCompletedEvent = {
  type: "run_completed"
  has_execution_error: boolean
  error_count: number
}

/**
 * The tab changed, or, when the host sets `activeTab`, RunFrame asks for
 * this tab and leaves the switch to the host.
 */
export type ActiveTabChangedEvent = {
  type: "active_tab_changed"
  tab: TabId
}

export type RunFrameNestedEvent =
  | ErrorEvent
  | RenderStartedEvent
  | CircuitJsonChangedEvent
  | RenderFinishedEvent
  | RunCompletedEvent
  | ActiveTabChangedEvent

export type RunFrameIframeEvent = {
  /** Same as `type`. The README has always documented this field. */
  runframe_type: "runframe_event"
  type: "runframe_event"
  runframe_event: RunFrameNestedEvent
}
