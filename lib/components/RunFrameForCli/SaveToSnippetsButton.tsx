import { useEffect, useMemo, useState } from "react"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import type { RequestToSaveSnippetEvent } from "../RunFrameWithApi/types"
import { SelectSnippetDialog } from "./SelectSnippetDialog"
import { useEventHandler } from "./useEventHandler"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export const SaveToSnippetsButton = () => {
  const [snippetName, setSnippetName] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [hasNeverBeenSaved, setHasNeverBeenSaved] = useState(true)
  const pushEvent = useRunFrameStore((state) => state.pushEvent)
  const recentEvents = useRunFrameStore((state) => state.recentEvents)
  const [isSaving, setIsSaving] = useState(false)
  const [requestToSaveSentAt, setRequestToSaveSentAt] = useState<number | null>(
    null,
  )
  const [availableSnippets, setAvailableSnippets] = useState<string[] | null>(
    null,
  )
  const [isSelectSnippetDialogOpen, setIsSelectSnippetDialogOpen] =
    useState(false)

  const firstRenderTime = useMemo(() => Date.now(), [])
  useEventHandler((event) => {
    if (new Date(event.created_at).valueOf() < firstRenderTime + 500) return
    if (event.event_type === "FILE_UPDATED") {
      setHasUnsavedChanges(true)
      return
    }
    if (event.event_type === "SNIPPET_SAVED") {
      setHasUnsavedChanges(false)
      setHasNeverBeenSaved(false)
      return
    }
  })

  useEffect(() => {
    if (!isSaving) return
    if (requestToSaveSentAt === null) return
    const eventsSinceRequestToSave = recentEvents.filter(
      (event) => new Date(event.created_at).valueOf() > requestToSaveSentAt,
    )

    const saveFailedEvent = eventsSinceRequestToSave.find(
      (event) => event.event_type === "FAILED_TO_SAVE_SNIPPET",
    )

    const saveSuccessEvent = eventsSinceRequestToSave.find(
      (event) => event.event_type === "SNIPPET_SAVED",
    )

    if (saveFailedEvent) {
      setIsSaving(false)
      setRequestToSaveSentAt(null)

      if (
        saveFailedEvent.error_code === "SNIPPET_UNSET" &&
        saveFailedEvent.available_snippet_names
      ) {
        setAvailableSnippets(saveFailedEvent.available_snippet_names)
        setIsSelectSnippetDialogOpen(true)
      }
    }

    if (saveSuccessEvent) {
      setIsSaving(false)
      setRequestToSaveSentAt(null)
    }
  }, [recentEvents, isSaving])

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          setIsSaving(true)
          setRequestToSaveSentAt(Date.now())
          await pushEvent({
            event_type: "REQUEST_TO_SAVE_SNIPPET",
            snippet_name: snippetName,
          } as RequestToSaveSnippetEvent)
        }}
        disabled={isSaving}
        className={`px-3 flex items-center text-sm py-1.5 rounded-md ${
          isSaving
            ? "cursor-not-allowed"
            : "bg-white border border-gray-300 font-medium text-gray-900 shadow-sm"
        }`}
      >
        {isSaving ? "Saving..." : "Save to Snippets"}
        {isSaving || hasNeverBeenSaved ? null : (
          <span className="rf-ml-1.5 rf-flex rf-items-center">
            {hasUnsavedChanges ? (
              <div className="rf-text-xs rf-bg-orange-400 rf-text-white rf-p-0.5 rf-px-1.5 rf-rounded">
                unsaved changes
              </div>
            ) : (
              <CheckCircle2 className="rf-w-4 rf-h-4 rf-text-green-500" />
            )}
          </span>
        )}
      </button>
      <SelectSnippetDialog
        snippetNames={availableSnippets ?? []}
        onSelect={async (name) => {
          setIsSaving(true)
          setRequestToSaveSentAt(Date.now())
          setSnippetName(name)
          await pushEvent({
            event_type: "REQUEST_TO_SAVE_SNIPPET",
            snippet_name: name,
          } as RequestToSaveSnippetEvent)
          setIsSelectSnippetDialogOpen(false)
        }}
        onCancel={() => setIsSelectSnippetDialogOpen(false)}
        isOpen={isSelectSnippetDialogOpen}
      />
    </>
  )
}
