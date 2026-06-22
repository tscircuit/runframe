/**
 * NOTE: RunFrame as a module is quite large, so you might want to vendor this
 * file into your project.
 */
import { useEffect, useRef } from "react"
import type { RunFrameProps } from "../RunFrame/RunFrameProps"

export interface RunFrameWithIframeProps extends RunFrameProps {
  iframeUrl?: string
}

export const getIframeTargetOrigin = (
  iframeUrl: string,
  baseUrl?: string,
): string | null => {
  try {
    return new URL(
      iframeUrl,
      baseUrl ??
        (typeof window === "undefined" ? undefined : window.location.href),
    ).origin
  } catch {
    return null
  }
}

export const shouldSendRunFramePropsToIframe = ({
  event,
  iframeWindow,
  targetOrigin,
}: {
  event: MessageEvent
  iframeWindow: WindowProxy | null | undefined
  targetOrigin: string | null
}): boolean => {
  return (
    Boolean(iframeWindow) &&
    Boolean(targetOrigin) &&
    event.source === iframeWindow &&
    event.origin === targetOrigin &&
    event.data?.runframe_type === "runframe_ready_to_receive"
  )
}

export const RunFrameWithIframe = ({
  iframeUrl = "https://runframe.tscircuit.com/iframe.html",
  ...runFrameProps
}: RunFrameWithIframeProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const runFramePropsRef = useRef(runFrameProps)

  useEffect(() => {
    runFramePropsRef.current = runFrameProps
  }, [runFrameProps])

  useEffect(() => {
    const targetOrigin = getIframeTargetOrigin(iframeUrl)
    const handleMessage = (event: MessageEvent) => {
      if (
        shouldSendRunFramePropsToIframe({
          event,
          iframeWindow: iframeRef.current?.contentWindow,
          targetOrigin,
        })
      ) {
        iframeRef.current?.contentWindow?.postMessage(
          {
            runframe_type: "runframe_props_changed",
            runframe_props: runFramePropsRef.current,
          },
          targetOrigin!,
        )
      }
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
