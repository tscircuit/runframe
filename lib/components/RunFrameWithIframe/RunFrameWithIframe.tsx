/**
 * NOTE: RunFrame as a module is quite large, so you might want to vendor this
 * file into your project.
 */
import { useEffect, useRef, useState } from "react"
import type { RunFrameProps } from "../RunFrame/RunFrameProps"
import { isRunFrameReadyMessageFromChild } from "./iframe-message-source"
import { useStableRunFrameProps } from "./use-stable-runframe-props"
import { postRunFrameProps } from "./post-runframe-props"

export interface RunFrameWithIframeProps extends RunFrameProps {
  iframeUrl?: string
}

export const RunFrameWithIframe = ({
  iframeUrl = "https://runframe.tscircuit.com/iframe.html",
  ...runFrameProps
}: RunFrameWithIframeProps) => {
  const stableProps = useStableRunFrameProps(runFrameProps)
  const [error, setError] = useState<Error | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const latestProps = useRef(stableProps)
  latestProps.current = stableProps
  const ready = useRef(false)

  useEffect(() => {
    ready.current = false
    const origin = new URL(iframeUrl, window.location.href).origin
    const handleMessage = (event: MessageEvent) => {
      if (
        isRunFrameReadyMessageFromChild({
          event,
          child: iframeRef.current?.contentWindow,
          origin,
        })
      ) {
        ready.current = true
        setError(
          postRunFrameProps({
            child: iframeRef.current?.contentWindow,
            origin,
            props: latestProps.current,
          }),
        )
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [iframeUrl])

  useEffect(() => {
    if (!ready.current) return
    setError(
      postRunFrameProps({
        child: iframeRef.current?.contentWindow,
        origin: new URL(iframeUrl, window.location.href).origin,
        props: stableProps,
      }),
    )
  }, [iframeUrl, stableProps])

  return (
    <div>
      {error && <p role="alert">{error.message}</p>}
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
