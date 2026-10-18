export function isRunFramePropsMessageFromParent(
  event: Pick<MessageEvent, "source" | "data">,
  parent: Window,
) {
  return (
    event.source === parent &&
    event.data !== null &&
    typeof event.data === "object" &&
    event.data.runframe_props !== null &&
    typeof event.data.runframe_props === "object" &&
    !Array.isArray(event.data.runframe_props)
  )
}

export function isRunFrameReadyMessageFromChild({
  event,
  child,
  origin,
}: {
  event: Pick<MessageEvent, "source" | "origin" | "data">
  child: Window | null | undefined
  origin: string
}) {
  return (
    Boolean(child) &&
    event.source === child &&
    event.origin === origin &&
    event.data?.runframe_type === "runframe_ready_to_receive"
  )
}
