import {
  RUNFRAME_IFRAME_CAPABILITIES,
  type RunFrameIframeEvent,
  type RunFrameIframeReadyMessage,
  type RunFrameNestedEvent,
} from "lib/components/RunFrameWithIframe/RunFrameIframeEvent"
import { getCircuitJsonElementCounts } from "lib/components/RunFrameWithIframe/get-circuit-json-element-counts"
import { RunFrame, type RunFrameProps } from "lib/runner"
import React, { useEffect, useReducer, useState } from "react"
import { createRoot } from "react-dom/client"
import { isRunFramePropsMessageFromParent } from "../components/RunFrameWithIframe/iframe-message-source"

const root = createRoot(document.getElementById("root")!)

const postEventToParent = (runframe_event: RunFrameNestedEvent) => {
  const msg: RunFrameIframeEvent = {
    runframe_type: "runframe_event",
    type: "runframe_event",
    runframe_event,
  }
  window.parent?.postMessage(msg, "*")
}

function IframeApp() {
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
          {...propsFromParent}
          onError={(error) => {
            postEventToParent({
              type: "error",
              error_message: error.message ?? error.toString(),
            })
          }}
          onRenderStarted={() => postEventToParent({ type: "render_started" })}
          onCircuitJsonChange={(circuitJson) => {
            postEventToParent({
              type: "circuit_json_changed",
              circuit_json_element_counts:
                getCircuitJsonElementCounts(circuitJson),
            })
          }}
          onRenderFinished={({ circuitJson }) => {
            postEventToParent({
              type: "render_finished",
              circuit_json_element_counts:
                getCircuitJsonElementCounts(circuitJson),
            })
          }}
          onRunCompleted={(payload) => {
            postEventToParent({
              type: "run_completed",
              has_execution_error: payload.hasExecutionError,
              error_count: payload.errors?.length ?? 0,
            })
          }}
          onActiveTabChange={(tab) => {
            postEventToParent({ type: "active_tab_changed", tab })
          }}
        />
      )}
    </div>
  )
}

root.render(
  <React.StrictMode>
    <IframeApp />
  </React.StrictMode>,
)
