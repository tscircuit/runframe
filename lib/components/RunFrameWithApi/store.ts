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
 * The number of events kept in `recentEvents`. The store keeps the newest
 * events, so this is the size of the lookback window for event consumers.
 */
export const MAX_RECENT_EVENTS = 100

const statusOf = (error: unknown): number | undefined =>
  (error as { status?: number } | null)?.status

export const isNotFoundError = (error: unknown) => statusOf(error) === 404

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) {
    // Without this check a failed request resolves to an HTML error page (or
    // an empty body) and the caller fails later with a confusing TypeError.
    throw Object.assign(
      new Error(`${url} failed with status ${response.status}`),
      { status: response.status },
    )
  }
  return response.json() as Promise<T>
}

async function upsertFileApi(
  path: FilePath,
  content: FileContent,
): Promise<File> {
  const data = await fetchJson<{ file: File }>(`${API_BASE}/files/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_path: path, text_content: content }),
  })
  return data.file
}

async function getFileApi(path: FilePath): Promise<File> {
  const data = await fetchJson<{ file: File }>(
    `${API_BASE}/files/get?file_path=${encodeURIComponent(path)}`,
  )
  return data.file
}

async function getEvents(since: string | null): Promise<FileUpdatedEvent[]> {
  const url = since
    ? `${API_BASE}/events/list?since=${encodeURIComponent(since)}`
    : `${API_BASE}/events/list`
  const data = await fetchJson<{ event_list: FileUpdatedEvent[] }>(url)
  return data.event_list ?? []
}

/**
 * Merge a chronological batch of events into the retained history.
 *
 * The result is newest-first and deduplicated by `event_id`, so overlapping
 * responses (the server compares timestamps inclusively) cannot show up twice
 * and `recentEvents[0]` always stays the latest event.
 */
export function mergeRecentEvents(
  previous: RunFrameEvent[],
  incoming: RunFrameEvent[],
): RunFrameEvent[] {
  if (incoming.length === 0) return previous

  const seen = new Set(incoming.map((event) => event.event_id))
  const keptPrevious = previous.filter((event) => !seen.has(event.event_id))

  return [...incoming]
    .reverse()
    .concat(keptPrevious)
    .slice(0, MAX_RECENT_EVENTS)
}

async function getInitialFilesFromApi(): Promise<Map<FilePath, FileContent>> {
  const { file_list } = await fetchJson<{
    file_list: Array<{ file_id: string; file_path: string }>
  }>(`${API_BASE}/files/list`)

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
/**
 * Handle for the pending poll tick, so `stopPolling` can cancel it instead of
 * leaving one more request in flight after the component unmounts.
 */
let pollTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Identifies the active polling loop. A restarted loop (React StrictMode
 * mounting twice, or a remount) bumps this so the previous loop's pending tick
 * cannot keep polling alongside the new one.
 */
let pollGeneration = 0

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
        const generation = ++pollGeneration

        const poll = async () => {
          if (generation !== pollGeneration) return
          const state = get()
          if (!state.isPolling) return

          try {
            const events = await getEvents(state.lastEventTime)

            if (events.length > 0) {
              // Update lastEventTime to the newest event in the batch. The
              // cursor only advances after the batch has been applied, so a
              // failed file fetch retries the same events instead of losing
              // them.
              const newLastEventTime = events.reduce(
                (latest, event) =>
                  new Date(event.created_at) > new Date(latest)
                    ? event.created_at
                    : latest,
                state.lastEventTime ?? events[events.length - 1].created_at,
              )

              debug(
                "received events",
                events.map((e) => e.event_type),
              )

              let fsUpdateCount = 0

              // Collect the effects of the batch in event order and apply them
              // at the end. Applying onto a snapshot taken before the awaits
              // would drop local edits made while the batch was fetched.
              const fileEffects: Array<
                | { type: "upsert"; path: FilePath; content: FileContent }
                | { type: "delete"; path: FilePath }
              > = []
              for (const event of events) {
                if (event.event_type === "FILE_UPDATED") {
                  // Don't update the manual edits file if we're the ones who changed it
                  if (
                    event.file_path === "manual_edits.json" &&
                    Date.now() - state.lastManualEditsChangeSentAt < 1000
                  ) {
                    continue
                  }
                  fsUpdateCount++
                  let file: File
                  try {
                    file = await getFileApi(event.file_path)
                  } catch (error) {
                    if (isNotFoundError(error)) {
                      // The file was deleted between the event and this fetch.
                      fileEffects.push({
                        type: "delete",
                        path: event.file_path,
                      })
                      continue
                    }
                    throw error
                  }
                  fileEffects.push({
                    type: "upsert",
                    path: file.file_path,
                    content: isDynamicFilePath(file.file_path)
                      ? (file.text_content ?? "")
                      : "__STATIC_ASSET__",
                  })
                  // Track recently saved files
                  get().addRecentlySavedFile(event.file_path)
                } else if (event.event_type === "FILE_DELETED") {
                  fsUpdateCount++
                  fileEffects.push({ type: "delete", path: event.file_path })
                }
              }

              if (fsUpdateCount > 0) {
                debug("updating fsMap, fsUpdateCount:", fsUpdateCount)
                set((current) => {
                  const fsMap = new Map(current.fsMap)
                  for (const effect of fileEffects) {
                    if (effect.type === "delete") fsMap.delete(effect.path)
                    else fsMap.set(effect.path, effect.content)
                  }
                  return { fsMap }
                })
              }

              set((current) => ({
                recentEvents: mergeRecentEvents(current.recentEvents, events),
                lastEventTime: newLastEventTime,
                // A successful poll means the dev server answered: clear any
                // stale "disconnected" error so the status dot can turn green
                // again after a restart.
                error: null,
              }))
            } else {
              // Empty batches still prove the connection works.
              if (get().error !== null) set({ error: null })
            }
          } catch (error) {
            set({ error: error as Error })
          }

          // Schedule next poll
          if (generation !== pollGeneration) return
          pollTimer = setTimeout(poll, 1000)
        }

        set({ isPolling: true })
        poll()
      },

      stopPolling: () => {
        pollGeneration++
        clearTimeout(pollTimer)
        pollTimer = undefined
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
