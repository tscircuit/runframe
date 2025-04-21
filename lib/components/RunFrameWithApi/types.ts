import type { ManualEditEvent } from "@tscircuit/props"
import type { CircuitJson } from "circuit-json"
import type { ComponentSearchResult } from "../ImportComponentDialog"
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
export interface InstallPackageEvent {
  event_id: string
  event_type: "INSTALL_PACKAGE"
  created_at: string
  full_package_name: string
}

export interface SnippetExportCreatedEvent {
  event_id: string
  event_type: "EXPORT_CREATED"
  created_at: string
  exportFilePath: string
}

export interface RequestToExportSnippetEvent {
  event_id: string
  event_type: "REQUEST_EXPORT"
  exportType: string
  created_at: string
}

export type RunFrameEvent =
  | FileUpdatedEvent
  | RequestToSaveSnippetEvent
  | FailedToSaveSnippetEvent
  | SnippetSavedEvent
  | SnippetExportCreatedEvent
  | RequestToExportSnippetEvent
  | InstallPackageEvent

type MappedOmit<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P]
}
export type RunFrameEventInput = MappedOmit<
  RunFrameEvent,
  "event_id" | "created_at"
>

export interface RunFrameState {
  fsMap: Map<FilePath, FileContent>
  lastEventTime: string | null
  isPolling: boolean
  error: Error | null
  circuitJson: CircuitJson | null
  lastManualEditsChangeSentAt: number
  recentEvents: RunFrameEvent[]
  simulateScenarioOrder: string | undefined
  // Actions
  upsertFile: (path: FilePath, content: FileContent) => Promise<void>
  getFile: (path: FilePath) => Promise<void>
  startPolling: () => void
  stopPolling: () => void
  setCircuitJson: (circuitJson: CircuitJson) => void
  applyEditEventsAndUpdateManualEditsJson: (
    editEvents: ManualEditEvent[],
  ) => Promise<void>
  pushEvent: (event: RunFrameEventInput) => Promise<void>
  loadInitialFiles: () => Promise<void>
  setSimulateScenarioOrder: (simulateScenarioOrder: string) => void
}

declare global {
  interface Window {
    /**
     * The base URL for the file server API
     */
    TSCIRCUIT_FILESERVER_API_BASE_URL: string
    /**
     * The base URL for the registry API
     */
    TSCIRCUIT_REGISTRY_API_BASE_URL: string
  }
}
