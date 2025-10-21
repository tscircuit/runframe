import clsx from "clsx"
import ky, { HTTPError } from "ky"
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react"
import { API_BASE } from "./RunFrameWithApi/api-base"
import { getRegistryKy, hasRegistryToken } from "lib/utils/get-registry-ky"
import { toast } from "lib/utils/toast"
import { buttonVariants } from "./ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"

declare global {
  interface Window {
    __TSCIRCUIT_LAST_EXECUTION_ERROR?: string
  }
}

type FsMapLike =
  | Map<string, string | undefined>
  | Record<string, string | undefined>
  | null
  | undefined

type UseBugReportDialogOptions = {
  fsMap?: FsMapLike
}

type UseBugReportDialogResult = {
  BugReportDialog: () => ReactElement
  openBugReportDialog: () => void
}

const normalizeFsMap = (fsMap?: FsMapLike) => {
  if (!fsMap) return null
  if (fsMap instanceof Map) return fsMap
  return new Map(Object.entries(fsMap))
}

const buildBugReportUrl = (bugReportId: string) => {
  const normalizedApiBase = API_BASE.endsWith("/") ? API_BASE : `${API_BASE}/`
  const baseForView =
    API_BASE.startsWith("http://") || API_BASE.startsWith("https://")
      ? normalizedApiBase
      : `${
          typeof window !== "undefined"
            ? window.location.origin
            : "https://api.tscircuit.com"
        }/${normalizedApiBase.replace(/^\//, "")}`

  return new URL(
    `bug_reports/view?bug_report_id=${bugReportId}`,
    baseForView,
  ).toString()
}

export const useBugReportDialog = ({
  fsMap,
}: UseBugReportDialogOptions): UseBugReportDialogResult => {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [userText, setUserText] = useState("")
  const [successState, setSuccessState] = useState<{
    bugReportUrl: string
  } | null>(null)

  const effectiveFsMap = useMemo(() => normalizeFsMap(fsMap), [fsMap])
  const bugReportFileCount = effectiveFsMap?.size ?? 0

  const isSessionLoggedIn = useMemo(() => {
    if (hasRegistryToken()) return true
    if (typeof document === "undefined") return false
    return document.cookie
      .split(";")
      .some((cookie) => cookie.trim().startsWith("session="))
  }, [isOpen])

  // Populate text field with execution error when dialog opens
  useEffect(() => {
    if (isOpen && !successState) {
      const globalError =
        typeof window !== "undefined"
          ? window.__TSCIRCUIT_LAST_EXECUTION_ERROR
          : undefined
      if (globalError) {
        setUserText(`I'm getting this execution error:\n\n${globalError}`)
      }
    }
  }, [isOpen, successState])

  const openBugReportDialog = useCallback(() => {
    setErrorMessage(null)
    setSuccessState(null)
    setUserText("")
    setIsOpen(true)
  }, [])

  const closeBugReportDialog = useCallback(() => {
    setIsOpen(false)
  }, [])

  const handleConfirmBugReport = useCallback(async () => {
    if (!effectiveFsMap || effectiveFsMap.size === 0) {
      toast.error("No project files available to include in the bug report")
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    const registryKy = getRegistryKy()

    try {
      const deleteAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      const createResponse = await registryKy
        .post("bug_reports/create", {
          json: {
            text: userText.trim() || undefined,
            is_auto_deleted: true,
            delete_at: deleteAt,
          },
        })
        .json<{
          ok: true
          bug_report: { bug_report_id: string }
        }>()

      const bugReportId = createResponse.bug_report.bug_report_id

      for (const [filePath, fileContents] of effectiveFsMap.entries()) {
        await registryKy.post("bug_reports/upload_file", {
          json: {
            bug_report_id: bugReportId,
            file_path: filePath,
            content_text: String(fileContents ?? ""),
          },
        })
      }

      const bugReportUrl = buildBugReportUrl(bugReportId)
      setSuccessState({ bugReportUrl })
    } catch (error) {
      console.error("Failed to submit bug report", error)
      if (error instanceof HTTPError) {
        if (error.response.status === 401) {
          const message =
            "You must be logged in to report a bug. Please sign in and try again."
          setErrorMessage(message)
          toast.error(message)
        } else {
          const message = `Failed to submit bug report (${error.response.status})`
          setErrorMessage(message)
          toast.error(message)
        }
      } else if (error instanceof Error) {
        setErrorMessage(error.message)
        toast.error(error.message)
      } else {
        const message = "Failed to submit bug report"
        setErrorMessage(message)
        toast.error(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [closeBugReportDialog, effectiveFsMap])

  const BugReportDialog = useCallback(() => {
    return (
      <AlertDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (!isSubmitting) {
              closeBugReportDialog()
            }
          } else {
            setErrorMessage(null)
            setSuccessState(null)
            setIsOpen(true)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {successState ? "Bug Report Created" : "Report Bug"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              {successState ? (
                <div className="rf-text-left rf-space-y-3 rf-text-sm">
                  <p>Bug report created successfully.</p>
                  <div>
                    <a
                      className="rf-text-blue-600 hover:rf-underline"
                      href={successState.bugReportUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View bug report
                    </a>
                  </div>
                  <p>
                    Please share this link privately with tscircuit staff so we
                    can help debug. Join the
                    <a
                      className="rf-ml-1 rf-text-blue-600 hover:rf-underline"
                      href="https://tscircuit.com/join"
                      target="_blank"
                      rel="noreferrer"
                    >
                      tscircuit Discord
                    </a>
                    .
                  </p>
                </div>
              ) : (
                <div className="rf-text-left rf-space-y-3 rf-text-sm">
                  <p>
                    Reporting a bug will upload your entire project
                    {bugReportFileCount > 0
                      ? ` (${bugReportFileCount} file${
                          bugReportFileCount === 1 ? "" : "s"
                        })`
                      : ""}{" "}
                    to tscircuit support.
                  </p>
                  <div className="rf-space-y-2">
                    <label
                      htmlFor="bug-description"
                      className="rf-block rf-font-medium"
                    >
                      Description (optional)
                    </label>
                    <textarea
                      id="bug-description"
                      className="rf-w-full rf-min-h-[100px] rf-px-3 rf-py-2 rf-text-sm rf-border rf-border-gray-300 rf-rounded-md focus:rf-outline-none focus:rf-ring-2 focus:rf-ring-blue-500"
                      placeholder="Describe the issue you're experiencing..."
                      value={userText}
                      onChange={(e) => setUserText(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <p>
                    Share the generated bug report link privately with tscircuit
                    staff so we can help debug your issue. You can also reach
                    out on our
                    <a
                      className="rf-ml-1 rf-text-blue-600 hover:rf-underline"
                      href="https://tscircuit.com/join"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Discord community
                    </a>
                    .
                  </p>
                  {!isSessionLoggedIn && (
                    <p className="rf-text-red-600">
                      You appear to be logged out. Please log in before
                      reporting a bug or the upload will fail.
                    </p>
                  )}
                  {errorMessage && (
                    <p className="rf-text-red-600">{errorMessage}</p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {successState ? (
              <button
                type="button"
                className={buttonVariants()}
                onClick={() => {
                  closeBugReportDialog()
                }}
              >
                Close
              </button>
            ) : (
              <>
                <AlertDialogCancel
                  disabled={isSubmitting}
                  onClick={() => {
                    if (!isSubmitting) {
                      closeBugReportDialog()
                    }
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <button
                  type="button"
                  className={clsx(
                    buttonVariants(),
                    isSubmitting && "rf-opacity-70 rf-cursor-not-allowed",
                  )}
                  disabled={isSubmitting}
                  onClick={(event) => {
                    event.preventDefault()
                    void handleConfirmBugReport()
                  }}
                >
                  {isSubmitting ? "Reporting..." : "Upload & Report"}
                </button>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }, [
    bugReportFileCount,
    closeBugReportDialog,
    errorMessage,
    handleConfirmBugReport,
    isOpen,
    isSessionLoggedIn,
    isSubmitting,
    successState,
    userText,
  ])

  return {
    BugReportDialog,
    openBugReportDialog,
  }
}
