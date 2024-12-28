import { useEffect, useState } from "react"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import type { RequestToSaveSnippetEvent } from "../RunFrameWithApi/types"
import { SelectSnippetDialog } from "./SelectSnippetDialog"

export const SaveToSnippetsButton = () => {
  const [snippetName, setSnippetName] = useState<string | null>(null)
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
          } as RequestToSaveSnippetEvent)
        }}
      >
        Save to Snippets
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
