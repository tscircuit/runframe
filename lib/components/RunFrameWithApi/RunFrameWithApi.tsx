import Debug from "debug"
import { useEditEventController } from "lib/hooks/use-edit-event-controller"
import { useHasReceivedInitialFilesLoaded } from "lib/hooks/use-has-received-initial-files-loaded"
import { useSyncPageTitle } from "lib/hooks/use-sync-page-title"
import { useLocalStorageState } from "lib/hooks/use-local-storage-state"
import { useEffect, useMemo, useState } from "react"
import { RunFrame } from "../RunFrame/RunFrame"
import { API_BASE } from "./api-base"
import { useRunFrameStore } from "./store"
import { applyEditEventsToManualEditsFile } from "@tscircuit/core"
import type { ManualEditsFile } from "@tscircuit/props"

import { EnhancedFileSelectorCombobox } from "./EnhancedFileSelectorCombobox"
import { getBoardFilesFromConfig } from "lib/utils/get-board-files-from-config"

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
  workerBlobUrl?: string
  evalWebWorkerBlobUrl?: string
  showFileMenu?: boolean

  /**
   * Enable fetch proxy for the web worker (useful for standalone bundles)
   */
  enableFetchProxy?: boolean
  /**
   * The main component path that should be selected initially when available.
   */
  initialMainComponentPath?: string
  /**
   * Callback invoked whenever the selected main component path changes.
   */
  onMainComponentPathChange?: (path: string) => void
}

export const RunFrameWithApi = (props: RunFrameWithApiProps) => {
  const { apiBaseUrl, leftHeaderContent } = props
  useEffect(() => {
    if (props.debug) Debug.enable("run-frame*")
  }, [props.debug])

  const { startPolling, stopPolling } = useRunFrameStore((s) => ({
    startPolling: s.startPolling,
    stopPolling: s.stopPolling,
  }))
  const hasReceivedInitialFiles = useHasReceivedInitialFilesLoaded()

  const fsMap = useRunFrameStore((s) => s.fsMap)
  const allFiles = useMemo(() => Array.from(fsMap.keys()), [fsMap])
  const projectConfigContent = useMemo(() => {
    const rawConfig = fsMap.get("tscircuit.config.json")
    return typeof rawConfig === "string" ? rawConfig : undefined
  }, [fsMap])
  const boardFiles = useMemo(
    () => getBoardFilesFromConfig(allFiles, projectConfigContent),
    [allFiles, projectConfigContent],
  )
  const circuitJson = useRunFrameStore((s) => s.circuitJson)

  const [componentPath, setComponentPath] = useLocalStorageState<string>(
    "runframe:selected-file",
    props.initialMainComponentPath ?? "",
  )
  const isLoadingFiles = !hasReceivedInitialFiles

  useEffect(() => {
    if (componentPath && boardFiles.includes(componentPath)) {
      // Retain current selection if it still exists
      return
    }
    const defaultPath = window?.TSCIRCUIT_DEFAULT_MAIN_COMPONENT_PATH
    const candidatePaths = [props.initialMainComponentPath, defaultPath].filter(
      (value): value is string => Boolean(value),
    )

    for (const candidate of candidatePaths) {
      if (boardFiles.includes(candidate)) {
        setComponentPath(candidate)
        return
      }
    }

    const firstMatch = boardFiles[0]
    if (firstMatch) {
      setComponentPath(firstMatch)
    }
  }, [boardFiles, props.initialMainComponentPath, componentPath])

  useEffect(() => {
    if (!componentPath) return
    props.onMainComponentPathChange?.(componentPath)
  }, [componentPath, props.onMainComponentPathChange])
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

  const componentProp = useMemo(
    () =>
      String(componentPath).length > 0
        ? {
            mainComponentPath: componentPath,
          }
        : {},
    [componentPath],
  )

  return (
    <RunFrame
      fsMap={fsMap}
      showFileMenu={props.showFileMenu}
      isLoadingFiles={isLoadingFiles}
      evalVersion={props.evalVersion}
      forceLatestEvalVersion={props.forceLatestEvalVersion}
      evalWebWorkerBlobUrl={props.evalWebWorkerBlobUrl ?? props.workerBlobUrl}
      enableFetchProxy={props.enableFetchProxy}
      leftHeaderContent={
        <div className="rf-flex rf-items-center rf-justify-between rf-w-full">
          {props.leftHeaderContent}
          {props.showFilesSwitch && (
            <div className="rf-absolute rf-left-1/2 rf-transform rf--translate-x-1/2">
              <EnhancedFileSelectorCombobox
                currentFile={componentPath}
                files={boardFiles}
                onFileChange={(value) => {
                  if (typeof fsMap.get(value) === "string") {
                    setComponentPath(value)
                  }
                }}
              />
            </div>
          )}
        </div>
      }
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
      {...componentProp}
    />
  )
}
