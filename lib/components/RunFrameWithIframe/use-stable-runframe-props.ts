import { useRef } from "react"
import type { RunFrameProps } from "../RunFrame/RunFrameProps"

/** A rest spread must not cause a full iframe resync on unrelated renders. */
export function useStableRunFrameProps(props: RunFrameProps) {
  const previous = useRef(props)
  const keys = Object.keys(props) as Array<keyof RunFrameProps>
  if (
    keys.length !== Object.keys(previous.current).length ||
    keys.some((key) => !Object.is(props[key], previous.current[key]))
  ) {
    previous.current = props
  }
  return previous.current
}
