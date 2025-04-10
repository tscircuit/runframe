import Debug from "debug"
import { useEditEventController } from "lib/hooks/use-edit-event-controller"
import { useEffect } from "react"
import { RunFrame } from "../RunFrame/RunFrame"
import { API_BASE } from "./api-base"
import { useRunFrameStore } from "./store"
import { applyPcbEditEventsToManualEditsFile, applySchematicEditEventsToManualEditsFile } from "@tscircuit/core"
import type { ManualEditsFile  } from "@tscircuit/props"

const debug = Debug("run-frame:RunFrameWithApi")

export const guessEntrypoint = (files: string[]) =>
  files.find((file) => file.includes("entrypoint.")) ??
  files.find((file) => file.includes("index.")) ??
  files.find((file) => file.includes("main.")) ??
  files.find((file) => file.endsWith(".tsx"))

export const guessManualEditsFilePath = (files: string[]) =>
  files.find((file) => file.includes("manual-edits.")) ??
  files.find((file) => file.includes("manual-edit.")) ??
  files.find((file) => file.endsWith(".json"))

export interface RunFrameWithApiProps {
  /**
   * Base URL for the API endpoints
   */
  apiBaseUrl?: string
  evalVersion?: string
  forceLatestEvalVersion?: boolean
  debug?: boolean
  leftHeaderContent?: React.ReactNode
  defaultToFullScreen?: boolean
  showToggleFullScreen?: boolean
}

export const RunFrameWithApi = (props: RunFrameWithApiProps) => {
  const { apiBaseUrl, leftHeaderContent } = props
  useEffect(() => {
    if (props.debug) Debug.enable("run-frame*")
  }, [props.debug])

  const { startPolling, stopPolling, loadInitialFiles } = useRunFrameStore(
    (s) => ({
      startPolling: s.startPolling,
      stopPolling: s.stopPolling,
      loadInitialFiles: s.loadInitialFiles,
    }),
  )

  const fsMap = useRunFrameStore((s) => s.fsMap)
  const circuitJson = useRunFrameStore((s) => s.circuitJson)

  useEffect(() => {
    loadInitialFiles()
  }, [])

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

  // Start/stop polling
  useEffect(() => {
    startPolling()
    return () => stopPolling()
  }, [startPolling, stopPolling])

  const entrypoint =
    guessEntrypoint(Array.from(fsMap.keys())) ?? "entrypoint.tsx"

  useEffect(() => {
    debug(`entrypoint set to ${entrypoint}`, {
      fsKeys: Array.from(fsMap.keys()),
    })
  }, [entrypoint])

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
      evalVersion={props.evalVersion}
      forceLatestEvalVersion={props.forceLatestEvalVersion}
      leftHeaderContent={leftHeaderContent}
      defaultToFullScreen={props.defaultToFullScreen}
      showToggleFullScreen={props.showToggleFullScreen}
      onInitialRender={() => {
        debug("onInitialRender / markRenderStarted")
        markRenderStarted()
      }}
      onRenderFinished={() => {
        debug("onRenderFinished / markRenderComplete")
        markRenderComplete()
      }}
      entrypoint={entrypoint}
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

        const manualEditsFilePath =
          guessManualEditsFilePath(Array.from(fsMap.keys())) ??
          "manual-edits.json"

        const manualEditsFile = fsMap.get(manualEditsFilePath)

        let currentState: ManualEditsFile = {
          pcb_placements: [],
          schematic_placements: [],
          manual_trace_hints: [],
        }
        try {
          if (manualEditsFile) {
            currentState = JSON.parse(manualEditsFile)
          }
        } catch (e) {
          console.error("Error parsing manual edits file:", e)
        }

        if (ee?.edit_event_type === "edit_pcb_component_location") {
          currentState = applyPcbEditEventsToManualEditsFile({
            circuitJson: circuitJson!,
            editEvents: [ee],
            manualEditsFile: currentState,
          })
        } else {
          currentState = applySchematicEditEventsToManualEditsFile({
            circuitJson: circuitJson!,
            editEvents: [ee],
            manualEditsFile: currentState,
          })
        }

        fetch(`${API_BASE}/files/upsert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_path: manualEditsFilePath,
            text_content: JSON.stringify(currentState),
            initiator: "runframe",
          }),
        })
      }}
    />
  )
}
