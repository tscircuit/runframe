import Debug from "debug"
import { useEditEventController } from "lib/hooks/use-edit-event-controller"
import { useHasReceivedInitialFilesLoaded } from "lib/hooks/use-has-received-initial-files-loaded"
import { useSyncPageTitle } from "lib/hooks/use-sync-page-title"
import { useLocalStorageState } from "lib/hooks/use-local-storage-state"
import { useCallback, useEffect, useMemo, useState } from "react"
import { RunFrame } from "../RunFrame/RunFrame"
import { API_BASE } from "./api-base"
import { useRunFrameStore } from "./store"
import { applyEditEventsToManualEditsFile } from "@tscircuit/core"
import type { ManualEditsFile } from "@tscircuit/props"

import { EnhancedFileSelectorCombobox } from "./EnhancedFileSelectorCombobox"
import { getBoardFilesFromConfig } from "lib/utils/get-board-files-from-config"

const debug = Debug("run-frame:RunFrameWithApi")

/**
 * Default file filter for selecting valid board files in the UI.
 * Matches the filter used in EnhancedFileSelectorCombobox to ensure
 * consistency between file browser display and auto-selection behavior.
 */
const DEFAULT_UI_FILE_FILTER = (filename: string) => {
  return (
    filename.endsWith(".tsx") ||
    filename.endsWith(".circuit.json") ||
    filename.endsWith(".jsx")
  )
}

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
  /**
   * File filter function to determine which files are valid for display in UI.
   */
  fileFilter?: (filename: string) => boolean
}

export const RunFrameWithApi = (props: RunFrameWithApiProps) => {
  const { apiBaseUrl, leftHeaderContent } = props
  useEffect(() => {
    if (props.debug) Debug.enable("run-frame*")
  }, [props.debug])

  const { startPolling, stopPolling, setCurrentMainComponentPath } =
    useRunFrameStore((s) => ({
      startPolling: s.startPolling,
      stopPolling: s.stopPolling,
      setCurrentMainComponentPath: s.setCurrentMainComponentPath,
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

  const [componentPath, setComponentPath] = useState<string>(() => {
    if (typeof window === "undefined")
      return props.initialMainComponentPath ?? ""
    const params = new URLSearchParams(window.location.hash.slice(1))
    return params.get("file") ?? props.initialMainComponentPath ?? ""
  })
  const [favorites, setFavorites] = useLocalStorageState<string[]>(
    "runframe:favorites",
    [],
  )
  const isLoadingFiles = !hasReceivedInitialFiles

  const handleToggleFavorite = useCallback(
    (filePath: string) => {
      setFavorites((prev) =>
        prev.includes(filePath)
          ? prev.filter((f) => f !== filePath)
          : [...prev, filePath],
      )
    },
    [setFavorites],
  )

  // Use provided file filter or default to UI-visible files
  const activeFileFilter = props.fileFilter ?? DEFAULT_UI_FILE_FILTER

  // Filter board files to only include UI-visible files
  const visibleBoardFiles = useMemo(
    () => boardFiles.filter(activeFileFilter),
    [boardFiles, activeFileFilter],
  )

  useEffect(() => {
    if (componentPath && visibleBoardFiles.includes(componentPath)) {
      // Retain current selection if it still exists
      return
    }

    // If current file was deleted, try to stay in the same directory
    if (componentPath) {
      const currentDir = componentPath.includes("/")
        ? componentPath.substring(0, componentPath.lastIndexOf("/"))
        : ""

      // Find another file in the same directory
      const fileInSameDir = visibleBoardFiles.find((file) => {
        const fileDir = file.includes("/")
          ? file.substring(0, file.lastIndexOf("/"))
          : ""
        return fileDir === currentDir
      })

      if (fileInSameDir) {
        setComponentPath(fileInSameDir)
        return
      }
    }

    const defaultPath = window?.TSCIRCUIT_DEFAULT_MAIN_COMPONENT_PATH
    const candidatePaths = [props.initialMainComponentPath, defaultPath].filter(
      (value): value is string => Boolean(value),
    )

    for (const candidate of candidatePaths) {
      if (visibleBoardFiles.includes(candidate)) {
        setComponentPath(candidate)
        return
      }
    }

    const firstMatch = visibleBoardFiles[0]
    if (firstMatch) {
      setComponentPath(firstMatch)
    }
  }, [visibleBoardFiles, props.initialMainComponentPath, componentPath])

  const updateFileHash = useCallback((filePath: string) => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.hash.slice(1))
    if (params.get("file") === filePath) return
    params.set("file", filePath)
    const newHash = params.toString()
    const newUrl =
      `${window.location.pathname}${window.location.search}` +
      (newHash.length > 0 ? `#${newHash}` : "")
    window.history.replaceState(null, "", newUrl)
  }, [])

  useEffect(() => {
    if (!componentPath) return
    updateFileHash(componentPath)
    props.onMainComponentPathChange?.(componentPath)
    setCurrentMainComponentPath(componentPath)
  }, [
    componentPath,
    props.onMainComponentPathChange,
    updateFileHash,
    setCurrentMainComponentPath,
  ])
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
                files={visibleBoardFiles}
                onFileChange={(value) => {
                  if (typeof fsMap.get(value) === "string") {
                    setComponentPath(value)
                  }
                }}
                pinnedFiles={favorites}
                onToggleFavorite={handleToggleFavorite}
                fileFilter={activeFileFilter}
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
