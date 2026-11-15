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

function assertResponseOk(response: Response, endpoint: string) {
  if (response.ok === false) {
    throw new Error(
      `RunFrame API request failed (${endpoint}): ${response.status} ${response.statusText}`,
    )
  }
}

function mergeRecentEvents(
  existing: RunFrameEvent[],
  incoming: RunFrameEvent[],
): RunFrameEvent[] {
  const seenIds = new Set<string>()
  const combined: RunFrameEvent[] = []

  for (let i = incoming.length - 1; i >= 0; i--) {
    const event = incoming[i]!
    if (event.event_id) {
      if (seenIds.has(event.event_id)) continue
      seenIds.add(event.event_id)
    }
    combined.push(event)
  }

  for (const event of existing) {
    if (event.event_id) {
      if (seenIds.has(event.event_id)) continue
      seenIds.add(event.event_id)
    }
    combined.push(event)
  }

  combined.sort((a, b) => b.created_at.localeCompare(a.created_at))
  return combined.slice(0, 100)
}

async function upsertFileApi(
  path: FilePath,
  content: FileContent,
): Promise<File> {
  const response = await fetch(`${API_BASE}/files/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_path: path, text_content: content }),
  })
  assertResponseOk(response, "/files/upsert")
  const data = await response.json()
  return data.file
}

async function getFileApi(path: FilePath): Promise<File> {
  const response = await fetch(
    `${API_BASE}/files/get?file_path=${encodeURIComponent(path)}`,
  )
  assertResponseOk(response, "/files/get")
  const data = await response.json()
  return data.file
}

async function getEvents(since: string | null): Promise<RunFrameEvent[]> {
  const url = since
    ? `${API_BASE}/events/list?since=${encodeURIComponent(since)}`
    : `${API_BASE}/events/list`
  const response = await fetch(url)
  assertResponseOk(response, "/events/list")
  const data = await response.json()
  return data.event_list
}

async function getInitialFilesFromApi(): Promise<Map<FilePath, FileContent>> {
  const response = await fetch(`${API_BASE}/files/list`)
  assertResponseOk(response, "/files/list")
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

let pollSessionId = 0

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
        if (get().isPolling) return
        const sessionId = ++pollSessionId

        const poll = async () => {
          const state = get()
          if (!state.isPolling || sessionId !== pollSessionId) return

          const prePollFsMap = new Map(state.fsMap)

          try {
            const events = await getEvents(state.lastEventTime)
            if (!get().isPolling || sessionId !== pollSessionId) return

            if (events.length === 0) {
              if (get().error !== null) {
                set({ error: null })
              }
            } else {
              debug(
                "received events",
                events.map((e) => e.event_type),
              )

              let lastInitialUploadIdx = -1
              for (let i = events.length - 1; i >= 0; i--) {
                if (events[i]?.event_type === "INITIAL_FILES_UPLOADED") {
                  lastInitialUploadIdx = i
                  break
                }
              }

              const resyncedBaselineFiles =
                lastInitialUploadIdx !== -1
                  ? await getInitialFilesFromApi()
                  : null
              if (!get().isPolling || sessionId !== pollSessionId) return

              const eventsToApply =
                lastInitialUploadIdx !== -1
                  ? events.slice(lastInitialUploadIdx + 1)
                  : events

              const updates = new Map<FilePath, FileContent | null>()
              const savedPathsToRecord: FilePath[] = []

              for (const event of eventsToApply) {
                if (event.event_type === "FILE_UPDATED") {
                  const file = await getFileApi(event.file_path)
                  if (!get().isPolling || sessionId !== pollSessionId) return

                  // Don't update the manual edits file if we're the ones who changed it
                  if (
                    IGNORED_SAVED_FILES.includes(event.file_path) &&
                    Date.now() - get().lastManualEditsChangeSentAt < 1000
                  ) {
                    continue
                  }
                  if (isDynamicFilePath(file.file_path)) {
                    updates.set(file.file_path, file.text_content ?? "")
                  } else {
                    updates.set(file.file_path, "__STATIC_ASSET__")
                  }
                  savedPathsToRecord.push(event.file_path)
                } else if (event.event_type === "FILE_DELETED") {
                  updates.set(event.file_path, null)
                }
              }

              let newLastEventTime =
                state.lastEventTime ?? events[0]!.created_at
              for (const event of events) {
                if (event.created_at > newLastEventTime) {
                  newLastEventTime = event.created_at
                }
              }

              set((currentState) => {
                let nextFsMap = currentState.fsMap

                if (resyncedBaselineFiles !== null || updates.size > 0) {
                  debug(
                    "updating fsMap, fsUpdateCount:",
                    updates.size,
                    "resynced:",
                    resyncedBaselineFiles !== null,
                  )
                  if (resyncedBaselineFiles !== null) {
                    nextFsMap = new Map(resyncedBaselineFiles)
                    // Preserve local saves completed while this poll was in flight
                    for (const [path, content] of currentState.fsMap) {
                      if (prePollFsMap.get(path) !== content) {
                        nextFsMap.set(path, content)
                      }
                    }
                  } else {
                    nextFsMap = new Map(currentState.fsMap)
                  }

                  for (const [path, content] of updates) {
                    if (content === null) {
                      nextFsMap.delete(path)
                    } else {
                      nextFsMap.set(path, content)
                    }
                  }
                }

                return {
                  fsMap: nextFsMap,
                  recentEvents: mergeRecentEvents(
                    currentState.recentEvents,
                    events,
                  ),
                  lastEventTime: newLastEventTime,
                  error: null,
                }
              })

              for (const filePath of savedPathsToRecord) {
                get().addRecentlySavedFile(filePath)
              }
            }
          } catch (error) {
            if (get().isPolling && sessionId === pollSessionId) {
              set({ error: error as Error })
            }
          }

          // Schedule next poll
          if (get().isPolling && sessionId === pollSessionId) {
            setTimeout(poll, 1000)
          }
        }

        set({ isPolling: true })
        poll()
      },

      stopPolling: () => {
        pollSessionId++
        set({ isPolling: false })
      },

      pushEvent: async (
        event: Omit<RunFrameEvent, "event_id" | "created_at">,
      ) => {
        const response = await fetch(`${API_BASE}/events/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        })
        assertResponseOk(response, "/events/create")
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
