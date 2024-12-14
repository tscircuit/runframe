// Types
export type FilePath = string
export type FileContent = string
export type FileId = string

export interface File {
  file_id: FileId
  file_path: FilePath
  text_content: FileContent
}

export interface FileEvent {
  event_id: string
  event_type: "FILE_UPDATED"
  file_path: FilePath
  created_at: string
}

export interface RunFrameState {
  fsMap: Map<FilePath, FileContent>
  lastEventTime: string | null
  isPolling: boolean
  error: Error | null

  // Actions
  upsertFile: (path: FilePath, content: FileContent) => Promise<void>
  getFile: (path: FilePath) => Promise<void>
  startPolling: () => void
  stopPolling: () => void
}

declare global {
  interface Window {
    API_BASE_URL: string
  }
}
