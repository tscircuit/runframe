import clsx from "clsx"
import ky, { HTTPError } from "ky"
import { useCallback, useMemo, useState, type ReactElement } from "react"
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

type FsMapLike =
  | Map<string, string | undefined>
  | Record<string, string | undefined>
  | null
  | undefined

type UseBugReportDialogOptions = {
  fsMap?: FsMapLike
  executionError?: string | null
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
  executionError,
}: UseBugReportDialogOptions): UseBugReportDialogResult => {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const effectiveFsMap = useMemo(() => normalizeFsMap(fsMap), [fsMap])
  const bugReportFileCount = effectiveFsMap?.size ?? 0

  const isSessionLoggedIn = useMemo(() => {
    if (hasRegistryToken()) return true
    if (typeof document === "undefined") return false
    return document.cookie
      .split(";")
      .some((cookie) => cookie.trim().startsWith("session="))
  }, [isOpen])

  const openBugReportDialog = useCallback(() => {
    setErrorMessage(null)
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
            text: executionError ?? undefined,
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

      closeBugReportDialog()
      const bugReportUrl = buildBugReportUrl(bugReportId)
      toast.success(
        <div className="rf-text-sm rf-space-y-2">
          <div>Bug report created successfully.</div>
          <div>
            <a
              className="rf-text-blue-600 hover:rf-underline"
              href={bugReportUrl}
              target="_blank"
              rel="noreferrer"
            >
              View bug report
            </a>
          </div>
          <div>
            Please share this link privately with tscircuit staff so we can help
            debug. Join the
            <a
              className="rf-ml-1 rf-text-blue-600 hover:rf-underline"
              href="https://tscircuit.com/join"
              target="_blank"
              rel="noreferrer"
            >
              tscircuit Discord
            </a>
            .
          </div>
        </div>,
      )
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
  }, [closeBugReportDialog, effectiveFsMap, executionError])

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
            setIsOpen(true)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report Bug</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="rf-text-left rf-space-y-3 rf-text-sm">
                <p>
                  Reporting a bug will upload your entire project
                  {bugReportFileCount > 0
                    ? ` (${bugReportFileCount} file${
                        bugReportFileCount === 1 ? "" : "s"
                      })`
                    : ""}{" "}
                  to tscircuit support. After submission the report will be
                  stored for approximately 48 hours then automatically deleted
                </p>
                <p>
                  Share the generated bug report link privately with tscircuit
                  staff so we can help debug your issue. You can also reach out
                  on our
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
                    You appear to be logged out. Please log in before reporting
                    a bug or the upload will fail.
                  </p>
                )}
                {errorMessage && (
                  <p className="rf-text-red-600">{errorMessage}</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
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
  ])

  return {
    BugReportDialog,
    openBugReportDialog,
  }
}
