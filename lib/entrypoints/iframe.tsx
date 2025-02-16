import type { RunFrameIframeEvent } from "lib/components/RunFrameWithIframe/RunFrameIframeEvent"
import { RunFrame, type RunFrameProps } from "lib/runner"
import React, { useEffect, useReducer, useState } from "react"
import { createRoot } from "react-dom/client"

const root = createRoot(document.getElementById("root")!)

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
      if (event.data && "runframe_props" in event.data) {
        setPropsFromParent(event.data.runframe_props)
        setPropsReceived(true)
      }
    }

    window.addEventListener("message", handleMessage)
    const msg = { runframe_type: "runframe_ready_to_receive" }
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
            const msg: RunFrameIframeEvent = {
              type: "runframe_event",
              runframe_event: {
                type: "error",
                error_message: error.message ?? error.toString(),
              },
            }
            window.parent?.postMessage(msg, "*")
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
