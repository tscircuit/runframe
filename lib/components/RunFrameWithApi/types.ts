import type { ManualEditEvent } from "@tscircuit/props"
import type { CircuitJson } from "circuit-json"
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
  circuitJson: CircuitJson | null
  lastManualEditsChangeSentAt: number

  // Actions
  upsertFile: (path: FilePath, content: FileContent) => Promise<void>
  getFile: (path: FilePath) => Promise<void>
  startPolling: () => void
  stopPolling: () => void
  setCircuitJson: (circuitJson: CircuitJson) => void
  applyEditEventsAndUpdateManualEditsJson: (
    editEvents: ManualEditEvent[],
  ) => Promise<void>
}

export interface RunFrameWithApiProps {
  /**
   * Base URL for the API endpoints
   */
  apiBaseUrl?: string
  debug?: boolean
}

declare global {
  interface Window {
    API_BASE_URL: string
  }
}
