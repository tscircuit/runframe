/**
 * NOTE: RunFrame as a module is quite large, so you might want to vendor this
 * file into your project.
 */
import { useEffect, useRef } from "react"
import type { RunFrameProps } from "../RunFrame/RunFrameProps"
import { isRunFrameReadyMessageFromChild } from "./iframe-message-source"

export interface RunFrameWithIframeProps extends RunFrameProps {
  iframeUrl?: string
}

export const RunFrameWithIframe = ({
  iframeUrl = "https://runframe.tscircuit.com/iframe.html",
  ...runFrameProps
}: RunFrameWithIframeProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const origin = new URL(iframeUrl, window.location.href).origin
    const handleMessage = (event: MessageEvent) => {
      if (
        isRunFrameReadyMessageFromChild(
          event,
          iframeRef.current?.contentWindow,
          origin,
        )
      ) {
        iframeRef.current?.contentWindow?.postMessage(
          {
            runframe_type: "runframe_props_changed",
            runframe_props: runFrameProps,
          },
          origin,
        )
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  return (
    <div>
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        title="tscircuit code runner and preview"
        frameBorder="0"
        scrolling="no"
        style={{
          overflow: "hidden",
          width: "100%",
          height: 600,
          border: "none",
          padding: 0,
          margin: 0,
          boxSizing: "border-box",
        }}
      />
    </div>
  )
}
