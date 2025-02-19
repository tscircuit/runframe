import { useEffect, useMemo, useState } from "react"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import type {
  FailedToSaveSnippetEvent,
  RequestToSaveSnippetEvent,
} from "../RunFrameWithApi/types"
import { SelectSnippetDialog } from "./SelectSnippetDialog"
import { useEventHandler } from "./useEventHandler"
import { CheckCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuPortal,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "../ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "../ui/alert-dialog"

const availableExports: Array<{ extension: string; name: string }> = [
  { extension: "json", name: "JSON" },
  { extension: "svg", name: "SVG" },
  { extension: "dsn", name: "Specctra DSN" },
  { extension: "glb", name: "GLB (Binary GLTF)" },
  { extension: "csv", name: "CSV (Comma-Separated Values)" },
  { extension: "text", name: "Plain Text" },
  { extension: "kicad_mod", name: "KiCad Module" },
  { extension: "kicad_project", name: "KiCad Project" },
  { extension: "gbr", name: "Gerbers" },
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
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
      setNotificationMessage("Export processing...")
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
    ) as FailedToSaveSnippetEvent
    const saveSuccessEvent = eventsSinceRequestToSave.find(
      (event) => event.event_type === "SNIPPET_SAVED",
    )

    if (saveFailedEvent) {
      setIsSaving(false)
      setRequestToSaveSentAt(null)
      setErrorMessage(
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
        <div className="rf-whitespace-nowrap rf-text-xs font-medium rf-p-2 rf-mx-1 rf-cursor-pointer rf-relative">
          File
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          className="rf-text-xs"
          onSelect={triggerSaveSnippet}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Push"}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="rf-text-xs" disabled={isExporting}>
            {isExporting ? "Exporting..." : "Export"}
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {availableExports.map((exp, i) => (
                <DropdownMenuItem
                  key={i}
                  onSelect={() => {
                    if (!isExporting) {
                      pushEvent({
                        event_type: "REQUEST_EXPORT",
                        exportType: exp.extension,
                      })
                      setNotificationMessage(`Export requested for ${exp.name}`)
                      setIsError(false)
                    }
                  }}
                  disabled={isExporting}
                >
                  <span className="rf-text-xs">{exp.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>

      <div className="!rf-h-full rf-w-fit rf-grid rf-place-items-center rf-my-auto">
        <div className="rf-flex rf-gap-4">
          {hasUnsavedChanges ||
            (hasNeverBeenSaved && (
              <button
                disabled={isSaving}
                onClick={triggerSaveSnippet}
                className="transition ease-in-out hover:scale-105 pointer-cursor rf-text-xs rf-h-fit disabled:rf-bg-blue-600/60 rf-bg-blue-600/70 rf-text-white rf-p-0.5 rf-px-1.5 rf-rounded"
              >
                {isSaving ? "Syncing..." : "Not Synced"}
              </button>
            ))}
          {notificationMessage && (
            <div
              className={`rf-text-xs rf-font-medium rf-mt-1 rf-flex rf-max-w-xl rf-text-blue-500 rf-break-words rf-text-center rf-h-full`}
            >
              <div className="rf-flex rf-items-center">
                <CheckCircle className="rf-w-4 rf-h-4 rf-inline rf-mr-1" />
                {notificationMessage}
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={isError} onOpenChange={setIsError}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error Saving Snippet</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsError(false)}>
              Dismiss
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
