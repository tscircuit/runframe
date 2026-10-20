import type { RunFrameProps } from "../RunFrame/RunFrameProps"

export function postRunFrameProps({
  child,
  origin,
  props,
}: {
  child: Window | null | undefined
  origin: string
  props: RunFrameProps
}): Error | null {
  if (!child) return new Error("RunFrame iframe is not available")
  try {
    child.postMessage(
      { runframe_type: "runframe_props_changed", runframe_props: props },
      origin,
    )
    return null
  } catch (error) {
    return new Error(
      "Cannot update RunFrame iframe. Its props must be structured-cloneable; callbacks and React elements cannot cross this iframe boundary.",
      { cause: error },
    )
  }
}
