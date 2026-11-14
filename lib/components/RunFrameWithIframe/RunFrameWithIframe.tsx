/**
 * NOTE: RunFrame as a module is quite large, so you might want to vendor this
 * file into your project.
 */
import { useEffect, useRef, useState } from "react"
import type { RunFrameProps } from "../RunFrame/RunFrameProps"
import {
  isRunFrameEventMessageFromChild,
  isRunFrameReadyMessageFromChild,
} from "./iframe-message-source"
import { useStableRunFrameProps } from "./use-stable-runframe-props"
import { postRunFrameProps } from "./post-runframe-props"

export interface RunFrameWithIframeProps extends RunFrameProps {
  iframeUrl?: string
}

export const RunFrameWithIframe = ({
  iframeUrl = "https://runframe.tscircuit.com/iframe.html",
  controller,
  ...runFrameProps
}: RunFrameWithIframeProps) => {
  // The controller's callback cannot cross the iframe boundary: its tab goes
  // as a prop, and the iframe's events come back to it as messages.
  const stableProps = useStableRunFrameProps(
    controller
      ? {
          ...runFrameProps,
          activeTab: controller.activeTab ?? runFrameProps.activeTab,
        }
      : runFrameProps,
  )
  const latestController = useRef(controller)
  latestController.current = controller
  const [error, setError] = useState<Error | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const latestProps = useRef(stableProps)
  latestProps.current = stableProps
  const ready = useRef(false)

  useEffect(() => {
    ready.current = false
    const origin = new URL(iframeUrl, window.location.href).origin
    const handleMessage = (event: MessageEvent) => {
      const child = iframeRef.current?.contentWindow
      if (isRunFrameEventMessageFromChild({ event, child, origin })) {
        latestController.current?.onEvent(event.data.runframe_event)
        return
      }
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
