import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type {
  FilePath,
  FileContent,
  File,
  FileEvent,
  RunFrameState,
} from "./types"

const API_BASE = window.API_BASE_URL ?? "/api"

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

async function getEvents(since: string | null): Promise<FileEvent[]> {
  const url = since
    ? `${API_BASE}/events/list?since=${encodeURIComponent(since)}`
    : `${API_BASE}/events/list`
  const response = await fetch(url)
  const data = await response.json()
  return data.event_list
}

// Create store
export const useRunFrameStore = create<RunFrameState>()(
  devtools(
    (set, get) => ({
      fsMap: new Map(),
      lastEventTime: null,
      isPolling: false,
      error: null,

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

      startPolling: () => {
        const poll = async () => {
          const state = get()
          if (!state.isPolling) return

          try {
            const events = await getEvents(state.lastEventTime)

            if (events.length > 0) {
              // Update lastEventTime to most recent event
              const newLastEventTime = events[events.length - 1].created_at

              // Process all file updates
              const updates = new Map(state.fsMap)
              for (const event of events) {
                if (event.event_type === "FILE_UPDATED") {
                  const file = await getFileApi(event.file_path)
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
    }),
    { name: "run-frame-store" },
  ),
)

// Export selector for current file map
export const selectCurrentFileMap = (state: RunFrameState) =>
  Object.fromEntries(state.fsMap.entries())
