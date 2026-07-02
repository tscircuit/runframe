import { applyEditEventsToManualEditsFile } from "@tscircuit/core"
import type { ManualEditEvent } from "@tscircuit/props"
import type { CircuitJson } from "circuit-json"
import Debug from "lib/utils/debug"
import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { API_BASE } from "./api-base"
import type {
  File,
  FileContent,
  FilePath,
  FileUpdatedEvent,
  RunFrameEvent,
  RunFrameState,
} from "./types"
import { isDynamicFilePath } from "./isDynamicFilePath"

const debug = Debug.extend("store")

/**
 * Wrapper around `fetch` that converts network-level failures (e.g. the local
 * file server being briefly unreachable) into a clear, handled error instead
 * of a bare `TypeError: Failed to fetch`. Callers are expected to catch this so
 * a transient outage surfaces as a handled warning/retry rather than an
 * unhandled promise rejection.
 */
async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch (error) {
    throw new Error(
      `RunFrame could not reach the file server at ${API_BASE}. Is it running?`,
      { cause: error },
    )
  }
}

async function upsertFileApi(
  path: FilePath,
  content: FileContent,
): Promise<File> {
  const response = await apiFetch(`${API_BASE}/files/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_path: path, text_content: content }),
  })
  const data = await response.json()
  return data.file
}

async function getFileApi(path: FilePath): Promise<File> {
  const response = await apiFetch(
    `${API_BASE}/files/get?file_path=${encodeURIComponent(path)}`,
  )
  const data = await response.json()
  return data.file
}

async function getEvents(since: string | null): Promise<FileUpdatedEvent[]> {
  const url = since
    ? `${API_BASE}/events/list?since=${encodeURIComponent(since)}`
    : `${API_BASE}/events/list`
  const response = await apiFetch(url)
  const data = await response.json()
  return data.event_list
}

async function getInitialFilesFromApi(): Promise<Map<FilePath, FileContent>> {
  const response = await apiFetch(`${API_BASE}/files/list`)
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

      setCircuitJson: (circuitJson: CircuitJson) => {
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
        const poll = async () => {
          const state = get()
          if (!state.isPolling) return

          try {
            const events = await getEvents(state.lastEventTime)

            if (events.length > 0) {
              // Update lastEventTime to most recent event
              const newLastEventTime = events[events.length - 1].created_at

              debug(
                "received events",
                events.map((e) => e.event_type),
              )

              set((state) => ({
                recentEvents: [...state.recentEvents, ...events].slice(0, 100),
                lastEventTime: newLastEventTime,
                // TODO sort
                // .sort((a, b) => b.created_at.localeCompare(a.created_at)),
              }))

              let fsUpdateCount = 0

              // Process all file updates
              const updates = new Map(state.fsMap)
              for (const event of events) {
                if (event.event_type === "FILE_UPDATED") {
                  fsUpdateCount++
                  const file = await getFileApi(event.file_path)
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
                  get().addRecentlySavedFile(event.file_path)
                } else if (event.event_type === "FILE_DELETED") {
                  fsUpdateCount++
                  updates.delete(event.file_path)
                }
              }

              if (fsUpdateCount > 0) {
                debug("updating fsMap, fsUpdateCount:", fsUpdateCount)
                set({
                  fsMap: updates,
                })
              }
            }
          } catch (error) {
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
        await apiFetch(`${API_BASE}/events/create`, {
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

        try {
          await upsertFileApi(
            "manual-edits.json",
            JSON.stringify(updatedManualEditsFileContent, null, 2),
          )
        } catch (error) {
          // The file server may be briefly unreachable (stopped/restarted/blip
          // mid-edit). Surface this as a handled error and let the caller retry
          // instead of leaking an unhandled "Failed to fetch" rejection.
          debug("failed to persist manual-edits.json", error)
          set({ error: error as Error })
          throw error
        }
      },

      setSimulateScenarioOrder: (scenarioOrder?: string) =>
        set({ simulateScenarioOrder: scenarioOrder }),

      setCurrentMainComponentPath: (path: string | null) =>
        set({ currentMainComponentPath: path }),
    }),
    { name: "run-frame-store" },
  ),
)
