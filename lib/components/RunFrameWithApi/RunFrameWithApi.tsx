import Debug from "debug"
import { useEditEventController } from "lib/hooks/use-edit-event-controller"
import { useSyncPageTitle } from "lib/hooks/use-sync-page-title"
import { useEffect, useState } from "react"
import { RunFrame } from "../RunFrame/RunFrame"
import { API_BASE } from "./api-base"
import { useRunFrameStore } from "./store"
import { applyEditEventsToManualEditsFile } from "@tscircuit/core"
import type { ManualEditsFile } from "@tscircuit/props"
import { FileSelectorCombobox } from "./file-selector-combobox"

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
  showFilesSwitch?: boolean
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

  const [mainComponentPath, setMainComponentPath] = useState<string>("")

  useEffect(() => {
    loadInitialFiles().then(() => {
      const files = Array.from(fsMap.keys())
      const defaultPath = window?.TSCIRCUIT_DEFAULT_MAIN_COMPONENT_PATH
      let selected = ""
      if (defaultPath && files.includes(defaultPath)) {
        selected = defaultPath
      } else {
        const firstMatch = files.find((f) => /\.(tsx|ts|js|jsx)$/.test(f))
        if (firstMatch) {
          selected = firstMatch
        }
      }
      setMainComponentPath(selected)
    })
  }, [])
  useSyncPageTitle()

  const {
    editEventsForRender,
    pushEditEvent,
    markRenderStarted,
    markRenderComplete,
  } = useEditEventController()

  // Initialize API base URL
  useEffect(() => {
    if (apiBaseUrl) {
      window.TSCIRCUIT_FILESERVER_API_BASE_URL = apiBaseUrl
    }
  }, [apiBaseUrl])

  // Start/stop polling
  useEffect(() => {
    startPolling()
    return () => stopPolling()
  }, [startPolling, stopPolling])

  return (
    <RunFrame
      fsMap={fsMap}
      evalVersion={props.evalVersion}
      forceLatestEvalVersion={props.forceLatestEvalVersion}
      leftHeaderContent={
        <div className="rf-flex rf-items-center rf-justify-between rf-w-full">
          {props.leftHeaderContent}
          <div className="rf-absolute rf-grid rf-place-items-center rf-w-screen rf-overflow-x-hidden">
            <FileSelectorCombobox
              currentFile={mainComponentPath}
              files={Array.from(fsMap.keys())}
              onFileChange={(value) => setMainComponentPath(value)}
            />
          </div>
        </div>
      }
      defaultToFullScreen={props.defaultToFullScreen}
      showToggleFullScreen={props.showToggleFullScreen}
      mainComponentPath={mainComponentPath}
      onInitialRender={() => {
        debug("onInitialRender / markRenderStarted")
        markRenderStarted()
      }}
      onRenderFinished={() => {
        debug("onRenderFinished / markRenderComplete")
        markRenderComplete()
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

        const manualEditsFilePath =
          guessManualEditsFilePath(Array.from(fsMap.keys())) ??
          "manual-edits.json"

        const manualEditsFile = fsMap.get(manualEditsFilePath)

        const updatedManualEdits: ManualEditsFile = JSON.parse(
          manualEditsFile ?? "{}",
        )

        applyEditEventsToManualEditsFile({
          circuitJson: circuitJson!,
          editEvents: [ee],
          manualEditsFile: updatedManualEdits,
        })

        fetch(`${API_BASE}/files/upsert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_path: manualEditsFilePath,
            text_content: JSON.stringify(updatedManualEdits),
            initiator: "runframe",
          }),
        })
      }}
    />
  )
}
