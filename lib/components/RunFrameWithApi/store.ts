import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type {
  FilePath,
  FileContent,
  File,
  FileUpdatedEvent,
  RunFrameState,
  RunFrameEvent,
} from "./types"
import { API_BASE } from "./api-base"
import type { ManualEditEvent } from "@tscircuit/props"
import { applyEditEventsToManualEditsFile } from "@tscircuit/core"
import type { CircuitJson } from "circuit-json"
import Debug from "lib/utils/debug"

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
  const data = await response.json()
  return data.file
}

async function getEvents(since: string | null): Promise<FileUpdatedEvent[]> {
  const url = since
    ? `${API_BASE}/events/list?since=${encodeURIComponent(since)}`
    : `${API_BASE}/events/list`
  const response = await fetch(url)
  const data = await response.json()
  return data.event_list
}

async function getInitialFilesApi(): Promise<Map<FilePath, FileContent>> {
  const response = await fetch(`${API_BASE}/files/list`)
  const { file_list } = (await response.json()) as {
    file_list: Array<{ file_id: string; file_path: string }>
  }

  const fileMap = new Map<FilePath, FileContent>()

  for (const file of file_list) {
    const fullFile = await getFileApi(file.file_path)
    fileMap.set(file.file_path, fullFile.text_content)
  }

  return fileMap
}

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

      loadInitialFiles: async () => {
        const fsMap = await getInitialFilesApi()
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

      startPolling: () => {
        const poll = async () => {
          const state = get()
          if (!state.isPolling) return

          try {
            const events = await getEvents(state.lastEventTime)

            if (events.length > 0) {
              set((state) => ({
                recentEvents: [...state.recentEvents, ...events].slice(0, 100),
                // TODO sort
                // .sort((a, b) => b.created_at.localeCompare(a.created_at)),
              }))
              // Update lastEventTime to most recent event
              const newLastEventTime = events[events.length - 1].created_at

              // Process all file updates
              const updates = new Map(state.fsMap)
              for (const event of events) {
                if (event.event_type === "FILE_UPDATED") {
                  const file = await getFileApi(event.file_path)
                  // Don't update the manual edits file if we're the ones who changed it
                  if (
                    event.file_path === "manual_edits.json" &&
                    Date.now() - state.lastManualEditsChangeSentAt < 1000
                  ) {
                    continue
                  }
                  updates.set(file.file_path, file.text_content)
                }
              }

              set({
                fsMap: updates,
                lastEventTime: newLastEventTime,
              })
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
        await fetch(`${window.API_BASE_URL ?? ""}/api/events/create`, {
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
    }),
    { name: "run-frame-store" },
  ),
)

// Export selector for current file map
export const selectCurrentFileMap = (state: RunFrameState) =>
  Object.fromEntries(state.fsMap.entries())
