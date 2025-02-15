import { useEffect, useMemo, useState } from "react"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import type { RequestToSaveSnippetEvent } from "../RunFrameWithApi/types"
import { SelectSnippetDialog } from "./SelectSnippetDialog"
import { useEventHandler } from "./useEventHandler"
import { AlertCircle, CheckCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu"

const availableExports = [
  "json",
  "svg",
  "dsn",
  "glb",
  "csv",
  "text",
  "kicad_mod",
  "kicad project",
]

export const RunframeCliLeftHeader = () => {
  const [snippetName, setSnippetName] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [hasNeverBeenSaved, setHasNeverBeenSaved] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [requestToSaveSentAt, setRequestToSaveSentAt] = useState<number | null>(
    null,
  )
  const [availableSnippets, setAvailableSnippets] = useState<string[] | null>(
    null,
  )
  const [isSelectSnippetDialogOpen, setIsSelectSnippetDialogOpen] =
    useState(false)
  const [notificationMessage, setNotificationMessage] = useState<string | null>(
    null,
  )
  const [isError, setIsError] = useState(false)
  const [isExporting, setisExporting] = useState(false)

  const pushEvent = useRunFrameStore((state) => state.pushEvent)
  const recentEvents = useRunFrameStore((state) => state.recentEvents)

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
      setNotificationMessage("Snippet saved successfully.")
      setIsError(false)
      return
    }
    if (event.event_type === "REQUEST_EXPORT") {
      setisExporting(true)
      setNotificationMessage("Export requested...")
      setIsError(false)
    }
    if (event.event_type === "EXPORT_CREATED") {
      setNotificationMessage(`Export created: ${event.exportFilePath}`)
      setIsError(false)
      setisExporting(false)
    }
  })

  useEffect(() => {
    if (!isSaving || requestToSaveSentAt === null) return
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
      setNotificationMessage(
        saveFailedEvent.message ??
          "Failed to save snippet. See console for error.",
      )
      console.error(saveFailedEvent.message)
      setIsError(true)
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
      setNotificationMessage("Snippet saved successfully.")
      setIsError(false)
    }
  }, [recentEvents, isSaving])

  const triggerSaveSnippet = async () => {
    setIsSaving(true)
    setRequestToSaveSentAt(Date.now())
    setNotificationMessage(null)
    setIsError(false)
    await pushEvent({
      event_type: "REQUEST_TO_SAVE_SNIPPET",
      snippet_name: snippetName,
    } as RequestToSaveSnippetEvent)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="rf-whitespace-nowrap rf-p-2 rf-mx-1 rf-cursor-pointer rf-relative">
          File
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="rf-*:text-xs">
        <DropdownMenuItem onSelect={triggerSaveSnippet} disabled={isSaving}>
          {isSaving ? "Saving..." : "Push"}
        </DropdownMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <DropdownMenuItem className="rf-hover:block" disabled={isExporting}>
              {isExporting ? "Exporting..." : "Export"}
            </DropdownMenuItem>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {availableExports.map((ext, i) => (
              <DropdownMenuItem
                key={i}
                onSelect={() => {
                  if (!isExporting) {
                    pushEvent({
                      event_type: "REQUEST_EXPORT",
                      exportType: ext,
                    })
                    setNotificationMessage(`Export requested: ${ext}`)
                    setIsError(false)
                  }
                }}
                disabled={isExporting}
              >
                {ext}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </DropdownMenuContent>

      <div className="!rf-h-full rf-w-fit rf-grid rf-place-items-center rf-my-auto">
        <div className="rf-flex rf-gap-4">
          {hasUnsavedChanges ||
            (hasNeverBeenSaved && (
              <div className="rf-text-xs rf-h-fit rf-bg-orange-400 rf-text-white rf-p-0.5 rf-px-1.5 rf-rounded">
                Unsaved changes
              </div>
            ))}
          {notificationMessage && (
            <div
              className={`rf-text-xs rf-mt-1 rf-flex rf-max-w-lg rf-break-words rf-text-center rf-h-full ${
                isError ? "rf-text-red-500" : "rf-text-green-500"
              }`}
            >
              <div className="rf-flex rf-items-center">
                {isError ? (
                  <AlertCircle className="rf-w-4 rf-h-4 rf-inline rf-mr-1" />
                ) : (
                  <CheckCircle className="rf-w-4 rf-h-4 rf-inline rf-mr-1" />
                )}
                {notificationMessage}
              </div>
            </div>
          )}
        </div>
      </div>

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
    </DropdownMenu>
  )
}
