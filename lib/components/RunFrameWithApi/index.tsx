import { useEffect, useMemo, useState } from "react"
import { RunFrame } from "../RunFrame"
import { useRunFrameStore, selectCurrentFileMap } from "./store"
import type { RunFrameWithApiProps } from "./types"
import type { ManualEditEvent } from "@tscircuit/props"
import { API_BASE } from "./api-base"
import { useEditEventController } from "lib/hooks/use-edit-event-controller"
import Debug from "debug"

const debug = Debug("run-frame:RunFrameWithApi")

const guessEntrypoint = (files: string[]) =>
  files.find((file) => file.includes("entrypoint.")) ??
  files.find((file) => file.includes("index.")) ??
  files.find((file) => file.includes("main.")) ??
  files.find((file) => file.endsWith(".tsx"))

export const RunFrameWithApi = (props: RunFrameWithApiProps) => {
  const { apiBaseUrl } = props
  useEffect(() => {
    if (props.debug) Debug.enable("run-frame*")
  }, [props.debug])

  const { startPolling, stopPolling } = useRunFrameStore((s) => ({
    startPolling: s.startPolling,
    stopPolling: s.stopPolling,
  }))
  const fsMap = useRunFrameStore((s) => s.fsMap)

  const {
    editEventsForRender,
    pushEditEvent,
    markRenderStarted,
    markRenderComplete,
  } = useEditEventController()

  // Initialize API base URL
  useEffect(() => {
    if (apiBaseUrl) {
      window.API_BASE_URL = apiBaseUrl
    }
  }, [apiBaseUrl])
  debug("editEventsForRender", editEventsForRender)

  // Start/stop polling
  useEffect(() => {
    startPolling()
    return () => stopPolling()
  }, [startPolling, stopPolling])

  const entrypoint =
    guessEntrypoint(Array.from(fsMap.keys())) ?? "entrypoint.tsx"

  if (!fsMap.get(entrypoint)) {
    return (
      <div>
        No entrypoint found for Run Frame! Found files:{" "}
        {Array.from(fsMap.keys()).join(",")}
      </div>
    )
  }

  return (
    <RunFrame
      fsMap={fsMap}
      onInitialRender={() => {
        debug("onInitialRender / markRenderStarted")
        markRenderStarted()
      }}
      onRenderFinished={() => {
        debug("onRenderFinished / markRenderComplete")
        markRenderComplete()
      }}
      entrypoint={entrypoint}
      onError={(error) => {
        console.error("RunFrame error:", error)
      }}
      editEvents={editEventsForRender}
      onEditEvent={(ee) => {
        pushEditEvent(ee)
        fetch(`${API_BASE}/events/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "USER_CREATED_MANUAL_EDIT",
            ...ee,
          }),
        })
      }}
    />
  )
}
