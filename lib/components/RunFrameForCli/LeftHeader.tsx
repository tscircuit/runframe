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
import { Checkbox } from "../ui/checkbox"
import { useRunnerStore } from "../RunFrame/runner-store/use-runner-store"
import { ImportComponentDialog } from "../ImportComponentDialog"
<<<<<<< HEAD
import {
  availableExports,
  exportAndDownload,
} from "lib/optional-features/exporting/export-and-download"
import { toast } from "lib/utils/toast"
import { Toaster } from "react-hot-toast"
import { importComponentFromJlcpcb } from "lib/optional-features/importing/import-component-from-jlcpcb"
=======
import { useOrderDialog } from "../OrderDialog/useOrderDialog"

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
>>>>>>> origin/main

export const RunframeCliLeftHeader = (props: {
  shouldLoadLatestEval: boolean
  onChangeShouldLoadLatestEval: (shouldLoadLatestEval: boolean) => void
}) => {
  const lastRunEvalVersion = useRunnerStore((s) => s.lastRunEvalVersion)
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
  const orderDialog = useOrderDialog()

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

  const circuitJson = useRunFrameStore((state) => state.circuitJson)

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  return (
    <>
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
          {/* HACK until ordering is ready, only show in cosmos runframe */}
          {parseInt(window.location.port) > 5000 && (
            <DropdownMenuItem
              className="rf-text-xs"
              onSelect={() => {
                orderDialog.open()
              }}
            >
              Order
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="rf-text-xs"
            onSelect={() => setIsImportDialogOpen(true)}
            disabled={isSaving}
          >
            Import
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className="rf-text-xs"
              disabled={isExporting}
            >
              {isExporting ? "Exporting..." : "Export"}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {availableExports.map((exp, i) => (
                  <DropdownMenuItem
                    key={i}
                    onSelect={() => {
                      if (!circuitJson) {
                        toast.error("No Circuit JSON to export")
                        return
                      }
                      exportAndDownload({
                        exportName: exp.name,
                        circuitJson,
                        projectName: snippetName ?? "Untitled",
                      })
                    }}
                    disabled={isExporting}
                  >
                    <span className="rf-text-xs">{exp.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="rf-text-xs">
              Advanced
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem className="rf-flex rf-items-center rf-gap-2">
                  <div className="rf-flex rf-items-center rf-gap-2">
                    <Checkbox
                      id="load-latest-eval"
                      checked={props.shouldLoadLatestEval}
                      onCheckedChange={(checked) => {
                        props.onChangeShouldLoadLatestEval(checked === true)
                      }}
                    />
                    <label
                      htmlFor="load-latest-eval"
                      className="rf-text-xs rf-cursor-pointer"
                    >
                      Force Latest @tscircuit/eval
                    </label>
                  </div>
                </DropdownMenuItem>
                {lastRunEvalVersion && (
                  <DropdownMenuItem className="rf-flex rf-items-center rf-gap-2">
                    <div className="rf-flex rf-items-center rf-gap-2">
                      <span className="rf-text-xs">
                        @tscircuit/eval@{lastRunEvalVersion}
                      </span>
                    </div>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="rf-flex rf-items-center rf-gap-2"
                  onClick={() => {
                    window.open("/api/admin", "_blank")
                  }}
                >
                  <div className="rf-flex rf-items-center rf-gap-2">
                    <span className="rf-text-xs">CLI Admin Panel</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>

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
      <ImportComponentDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={async (component) => {
          toast.promise(
            async () => {
              if (component.source === "tscircuit.com") {
                await pushEvent({
                  event_type: "INSTALL_PACKAGE",
                  full_package_name: `@tsci/${component.owner}.${component.name}`,
                })
              } else if (component.source === "jlcpcb") {
                await importComponentFromJlcpcb(component.partNumber!)
              }
            },
            {
              loading: `Importing component: "${component.name}"`,
            },
          )
          // await pushEvent({
          //   event_type: "IMPORT_COMPONENT",
          //   component: component,
          // })
        }}
      />
      <Toaster position="top-center" reverseOrder={false} />
      <orderDialog.OrderDialog />
    </>
  )
}
