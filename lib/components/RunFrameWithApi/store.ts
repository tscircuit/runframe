import { applyEditEventsToManualEditsFile } from "@tscircuit/core"
import type { ManualEditEvent } from "@tscircuit/props"
import type { CircuitJson } from "circuit-json"
import Debug from "lib/utils/debug"
import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { API_BASE } from "./api-base"
import type {
  File,
  FileContent,
  FilePath,
  RunFrameEvent,
  RunFrameState,
} from "./types"
import { isDynamicFilePath } from "./isDynamicFilePath"

const debug = Debug.extend("store")

async function upsertFileApi(
  path: FilePath,
  content: FileContent,
): Promise<File> {
  const response = await fetch(`${API_BASE}/files/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_path: path, text_content: content }),
  })
  const data = await response.json()
  return data.file
}

async function getFileApi(path: FilePath): Promise<File> {
  const response = await fetch(
    `${API_BASE}/files/get?file_path=${encodeURIComponent(path)}`,
  )
  if (!response.ok)
    throw new Error(`Unable to fetch file: HTTP ${response.status}`)
  const data = await response.json()
  return data.file
}

async function getEvents(since: string | null): Promise<RunFrameEvent[]> {
  const url = since
    ? `${API_BASE}/events/list?since=${encodeURIComponent(since)}`
    : `${API_BASE}/events/list`
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(`Unable to fetch events: HTTP ${response.status}`)
  const data = await response.json()
  return data.event_list
}

async function getInitialFilesFromApi(): Promise<Map<FilePath, FileContent>> {
  const response = await fetch(`${API_BASE}/files/list`)
  if (!response.ok)
    throw new Error(`Unable to list files: HTTP ${response.status}`)
  const { file_list } = (await response.json()) as {
    file_list: Array<{ file_id: string; file_path: string }>
  }

  const fileMap = new Map<FilePath, FileContent>()

  for (const file of file_list) {
    if (isDynamicFilePath(file.file_path)) {
      const fullFile = await getFileApi(file.file_path)
      fileMap.set(file.file_path, fullFile.text_content)
      continue
    }
    fileMap.set(file.file_path, "__STATIC_ASSET__")
  }

  return fileMap
}

// Files that should not be tracked in recently saved
const IGNORED_SAVED_FILES = ["manual-edits.json", "manual_edits.json"]

// Create store
export const useRunFrameStore = create<RunFrameState>()(
  devtools(
    (set, get) => ({
      fsMap: new Map(),
      lastEventTime: new Date().toISOString(),
      isPolling: false,
      error: null,
      circuitJson: null,
      lastManualEditsChangeSentAt: 0,
      recentEvents: [],
      simulateScenarioOrder: undefined,
      currentMainComponentPath: null,
      recentlySavedFiles: [],

      loadInitialFiles: async () => {
        const fsMap = await getInitialFilesFromApi()
        debug("loaded initial files", { fsMap })
        set({ fsMap })
      },

      upsertFile: async (path, content) => {
        try {
          const file = await upsertFileApi(path, content)
          set((state) => ({
            fsMap: new Map(state.fsMap).set(file.file_path, file.text_content),
          }))
        } catch (error) {
          set({ error: error as Error })
        }
      },

      getFile: async (path) => {
        try {
          const file = await getFileApi(path)
          set((state) => ({
            fsMap: new Map(state.fsMap).set(file.file_path, file.text_content),
          }))
        } catch (error) {
          set({ error: error as Error })
        }
      },

      setCircuitJson: (circuitJson: CircuitJson | null) => {
        if (circuitJson === get().circuitJson) return
        set({ circuitJson })
      },

      addRecentlySavedFile: (path: FilePath) => {
        set((state) => {
          // Don't track ignored files like manual-edits.json
          if (IGNORED_SAVED_FILES.includes(path)) return state
          // Only track actual source files
          if (!isDynamicFilePath(path)) return state

          const filtered = state.recentlySavedFiles.filter((f) => f !== path)
          return {
            recentlySavedFiles: [path, ...filtered].slice(0, 10),
          }
        })
      },

      startPolling: () => {
        let needsFileResync = false
        const poll = async () => {
          const state = get()
          if (!state.isPolling) return

          let receivedEvents = false
          try {
            const events = await getEvents(state.lastEventTime)
            receivedEvents = true
            const resyncedFiles = needsFileResync
              ? await getInitialFilesFromApi()
              : undefined

            if (events.length > 0 || resyncedFiles) {
              // Update lastEventTime to most recent event
              const newLastEventTime =
                events.at(-1)?.created_at ?? state.lastEventTime

              debug(
                "received events",
                events.map((e) => e.event_type),
              )

              let fsUpdateCount = 0

              // Process all file updates
              const updates = new Map<FilePath, FileContent | null>()
              const savedPaths: FilePath[] = []
              for (const event of events) {
                if (event.event_type === "FILE_UPDATED") {
                  fsUpdateCount++
                  if (resyncedFiles && !resyncedFiles.has(event.file_path)) {
                    updates.set(event.file_path, null)
                    continue
                  }
                  const file = resyncedFiles
                    ? {
                        file_path: event.file_path,
                        text_content: resyncedFiles.get(event.file_path)!,
                      }
                    : await getFileApi(event.file_path)
                  // Don't update the manual edits file if we're the ones who changed it
                  if (
                    event.file_path === "manual_edits.json" &&
                    Date.now() - state.lastManualEditsChangeSentAt < 1000
                  ) {
                    continue
                  }
                  if (isDynamicFilePath(file.file_path)) {
                    updates.set(file.file_path, file.text_content ?? "")
                  } else {
                    updates.set(file.file_path, "__STATIC_ASSET__")
                  }
                  // Track recently saved files
                  savedPaths.push(event.file_path)
                } else if (event.event_type === "FILE_DELETED") {
                  fsUpdateCount++
                  if (!resyncedFiles) updates.set(event.file_path, null)
                }
              }

              if (fsUpdateCount > 0) {
                debug("updating fsMap, fsUpdateCount:", fsUpdateCount)
              }
              // Publish the batch only after all requests succeed. Failed batches
              // retain their cursor and can be retried without losing file changes.
              set((current) => {
                const fsMap = new Map(resyncedFiles ?? current.fsMap)
                for (const [path, content] of updates) {
                  if (content === null) fsMap.delete(path)
                  else fsMap.set(path, content)
                }
                if (resyncedFiles) {
                  // Reconcile offline deletions, preserving local changes made
                  // while the full server snapshot was being downloaded.
                  for (const path of new Set([
                    ...state.fsMap.keys(),
                    ...current.fsMap.keys(),
                  ])) {
                    if (
                      state.fsMap.has(path) === current.fsMap.has(path) &&
                      state.fsMap.get(path) === current.fsMap.get(path)
                    )
                      continue
                    if (current.fsMap.has(path))
                      fsMap.set(path, current.fsMap.get(path)!)
                    else fsMap.delete(path)
                  }
                }
                let recentlySavedFiles = current.recentlySavedFiles
                for (const path of savedPaths) {
                  if (
                    IGNORED_SAVED_FILES.includes(path) ||
                    !isDynamicFilePath(path)
                  )
                    continue
                  recentlySavedFiles = [
                    path,
                    ...recentlySavedFiles.filter((saved) => saved !== path),
                  ].slice(0, 10)
                }
                return {
                  fsMap,
                  recentlySavedFiles,
                  recentEvents: [...events]
                    .reverse()
                    .concat(current.recentEvents)
                    .slice(0, 100),
                  lastEventTime: newLastEventTime,
                  error: null,
                }
              })
            } else {
              set({ error: null })
            }
            needsFileResync = false
          } catch (error) {
            if (!receivedEvents) needsFileResync = true
            set({ error: error as Error })
          }

          // Schedule next poll
          setTimeout(poll, 1000)
        }

        set({ isPolling: true })
        poll()
      },

      stopPolling: () => {
        set({ isPolling: false })
      },

      pushEvent: async (
        event: Omit<RunFrameEvent, "event_id" | "created_at">,
      ) => {
        await fetch(`${API_BASE}/events/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        })
      },

      applyEditEventsAndUpdateManualEditsJson: async (
        editEvents: ManualEditEvent[],
      ) => {
        debug("applyEditEventsAndUpdateManualEditsJson", { editEvents })
        const state = get()
        if (!state.circuitJson) return

        const manualEditsJson = state.fsMap.get("manual-edits.json")
        const manualEdits = manualEditsJson ? JSON.parse(manualEditsJson) : {}

        // TODO apply manual edit events to manual edits file
        const updatedManualEditsFileContent = applyEditEventsToManualEditsFile({
          circuitJson: state.circuitJson as any,
          editEvents,
          manualEditsFile: manualEdits,
        })
        debug("updatedManualEditsFileContent", updatedManualEditsFileContent)

        set((state) => ({
          lastManualEditsChangeSentAt: Date.now(),
          fsMap: new Map(state.fsMap).set(
            "manual-edits.json",
            JSON.stringify(updatedManualEditsFileContent),
          ),
        }))

        await upsertFileApi(
          "manual-edits.json",
          JSON.stringify(updatedManualEditsFileContent, null, 2),
        )
      },

      setSimulateScenarioOrder: (scenarioOrder?: string) =>
        set({ simulateScenarioOrder: scenarioOrder }),

      setCurrentMainComponentPath: (path: string | null) =>
        set({ currentMainComponentPath: path }),
    }),
    { name: "run-frame-store" },
  ),
)
