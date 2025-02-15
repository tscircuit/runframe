export type ErrorEvent = {
  type: "error"
  error_message: string
}

export type FullScreenEvent = {
  type: "toggle_full_screen"
  full_screen_enabled: boolean
}

export type RunFrameNestedEvent = ErrorEvent

export type RunFrameIframeEvent = {
  type: "runframe_event"
  runframe_event: RunFrameNestedEvent
}
