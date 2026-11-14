import { useEffect, useReducer, useState } from "react"
import { RunFrame } from "../RunFrame/RunFrame"
import type { RunFrameProps } from "../RunFrame/RunFrameProps"
import { getRunFrameEventCallbacks } from "../RunFrame/get-run-frame-event-callbacks"
import {
  RUNFRAME_IFRAME_CAPABILITIES,
  type RunFrameIframeEvent,
  type RunFrameIframeReadyMessage,
  type RunFrameNestedEvent,
} from "../RunFrameWithIframe/RunFrameIframeEvent"
import { isRunFramePropsMessageFromParent } from "../RunFrameWithIframe/iframe-message-source"

const postEventToParent = (runframe_event: RunFrameNestedEvent) => {
  const msg: RunFrameIframeEvent = {
    runframe_type: "runframe_event",
    type: "runframe_event",
    runframe_event,
  }
  window.parent?.postMessage(msg, "*")
}

/**
 * RunFrame for a page that sits in an iframe and is driven by its parent: it
 * takes its props from `runframe_props_changed` messages and posts its events
 * back. This is what iframe.html renders, and what the standalone bundle
 * renders when `window.TSCIRCUIT_USE_RUNFRAME_PROPS_FROM_PARENT` is set.
 */
export const RunFrameInIframe = ({
  defaultProps,
}: {
  /** Props used until the parent sends its own value for them. */
  defaultProps?: Partial<RunFrameProps>
}) => {
  const [propsFromParent, setPropsFromParent] = useReducer(
    (props: RunFrameProps, newProps: Partial<RunFrameProps>) => ({
      ...props,
      ...newProps,
    }),
    {} as RunFrameProps,
  )
  const [propsReceived, setPropsReceived] = useState(false)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (isRunFramePropsMessageFromParent(event, window.parent)) {
        setPropsFromParent(event.data.runframe_props)
        setPropsReceived(true)
      }
    }

    window.addEventListener("message", handleMessage)
    const msg: RunFrameIframeReadyMessage = {
      runframe_type: "runframe_ready_to_receive",
      runframe_capabilities: RUNFRAME_IFRAME_CAPABILITIES,
    }
    window.parent?.postMessage(msg, "*")
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      {!propsReceived && (
        <div>
          <div className="rf-gray-500">Waiting for code...</div>
        </div>
      )}
      {propsReceived && (
        <RunFrame
          debug={window.location.search.includes("debug")}
          showToggleFullScreen={false}
          defaultActiveTab="cad"
          {...defaultProps}
          {...propsFromParent}
          {...getRunFrameEventCallbacks(postEventToParent)}
        />
      )}
    </div>
  )
}
