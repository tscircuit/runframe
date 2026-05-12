/**
 * NOTE: RunFrame as a module is quite large, so you might want to vendor this
 * file into your project.
 */
import { useEffect, useRef } from "react"
import type { RunFrameProps } from "../RunFrame/RunFrameProps"

export interface RunFrameWithIframeProps extends RunFrameProps {
  iframeUrl?: string
}

export const getRunFrameIframeTargetOrigin = (
  iframeUrl: string,
  baseUrl: string,
) => {
  const origin = new URL(iframeUrl, baseUrl).origin

  return origin === "null" ? "*" : origin
}

export const isRunFrameReadyMessageFromIframe = (
  event: Pick<MessageEvent, "data" | "origin" | "source">,
  iframeWindow: Window | null,
  targetOrigin: string,
) => {
  if (!iframeWindow || event.source !== iframeWindow) return false
  if (targetOrigin !== "*" && event.origin !== targetOrigin) return false

  return event.data?.runframe_type === "runframe_ready_to_receive"
}

export const RunFrameWithIframe = ({
  iframeUrl = "https://runframe.tscircuit.com/iframe.html",
  ...runFrameProps
}: RunFrameWithIframeProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const runFramePropsRef = useRef(runFrameProps)
  runFramePropsRef.current = runFrameProps

  useEffect(() => {
    const targetOrigin = getRunFrameIframeTargetOrigin(
      iframeUrl,
      window.location.href,
    )

    const handleMessage = (event: MessageEvent) => {
      const iframeWindow = iframeRef.current?.contentWindow ?? null

      if (!iframeWindow) return

      if (
        !isRunFrameReadyMessageFromIframe(event, iframeWindow, targetOrigin)
      ) {
        return
      }

      iframeWindow.postMessage(
        {
          runframe_type: "runframe_props_changed",
          runframe_props: runFramePropsRef.current,
        },
        targetOrigin,
      )
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [iframeUrl])

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
