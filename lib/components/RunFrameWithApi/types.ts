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

export interface FileUpdatedEvent {
  event_id: string
  event_type: "FILE_UPDATED"
  file_path: FilePath
  created_at: string
}

export interface RequestToSaveSnippetEvent {
  event_id: string
  event_type: "REQUEST_TO_SAVE_SNIPPET"
  snippet_name?: string
  created_at: string
}

export interface FailedToSaveSnippetEvent {
  event_id: string
  event_type: "FAILED_TO_SAVE_SNIPPET"
  error_code: "SNIPPET_UNSET" | "SERVER_ERROR"
  message?: string

  /**
   * When error_code is "SNIPPET_UNSET", this is the list of available snippets
   * to prompt the user with
   */
  available_snippet_names?: string[]
  created_at: string
}

export interface SnippetSavedEvent {
  event_id: string
  event_type: "SNIPPET_SAVED"
  created_at: string
}

export type RunFrameEvent =
  | FileUpdatedEvent
  | RequestToSaveSnippetEvent
  | FailedToSaveSnippetEvent
  | SnippetSavedEvent

export interface RunFrameState {
  fsMap: Map<FilePath, FileContent>
  lastEventTime: string | null
  isPolling: boolean
  error: Error | null
  circuitJson: CircuitJson | null
  lastManualEditsChangeSentAt: number
  recentEvents: RunFrameEvent[]

  // Actions
  upsertFile: (path: FilePath, content: FileContent) => Promise<void>
  getFile: (path: FilePath) => Promise<void>
  startPolling: () => void
  stopPolling: () => void
  setCircuitJson: (circuitJson: CircuitJson) => void
  applyEditEventsAndUpdateManualEditsJson: (
    editEvents: ManualEditEvent[],
  ) => Promise<void>
  pushEvent: (
    event: Omit<RunFrameEvent, "event_id" | "created_at">,
  ) => Promise<void>
}

declare global {
  interface Window {
    API_BASE_URL: string
  }
}
