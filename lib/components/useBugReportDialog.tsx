import clsx from "clsx"
import { HTTPError } from "ky"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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

type UseBugReportDialogResult = {
  BugReportDialog: ReactElement
  openBugReportDialog: () => void
}

type FileContent = {
  text_content?: string
  binary_content_b64?: string
}

async function getFilesFromServer(): Promise<Map<string, FileContent>> {
  const response = await fetch(`${API_BASE}/files/list`)
  const { file_list } = (await response.json()) as {
    file_list: Array<{ file_id: string; file_path: string }>
  }

  const fileMap = new Map<string, FileContent>()

  for (const file of file_list) {
    const fileResponse = await fetch(
      `${API_BASE}/files/get?file_path=${encodeURIComponent(file.file_path)}`,
    )
    const fileData = await fileResponse.json()

    // Include files with either text or binary content
    if (fileData.file?.text_content || fileData.file?.binary_content_b64) {
      fileMap.set(file.file_path, {
        text_content: fileData.file.text_content,
        binary_content_b64: fileData.file.binary_content_b64,
      })
    }
  }

  return fileMap
}

const BUG_REPORT_VIEW_BASE_URL =
  "https://api.tscircuit.com/bug_reports/view?bug_report_id="

const buildBugReportUrl = (bugReportId: string) =>
  `${BUG_REPORT_VIEW_BASE_URL}${bugReportId}`

export const useBugReportDialog = (): UseBugReportDialogResult => {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [successState, setSuccessState] = useState<{
    bugReportUrl: string
  } | null>(null)
  const [bugReportFileCount, setBugReportFileCount] = useState<number>(0)

  const isSessionLoggedIn = useMemo(() => {
    if (hasRegistryToken()) return true
    if (typeof document === "undefined") return false
    return document.cookie
      .split(";")
      .some((cookie) => cookie.trim().startsWith("session="))
  }, [isOpen])

  // Populate text field with execution error when dialog opens
  useEffect(() => {
    if (isOpen && !successState && textareaRef.current) {
      const globalError =
        typeof window !== "undefined"
          ? window.__TSCIRCUIT_LAST_EXECUTION_ERROR
          : undefined
      if (globalError) {
        textareaRef.current.value = `I'm getting this execution error:\n\n${globalError}`
      }
    }
  }, [isOpen, successState])

  // Fetch file count when dialog opens
  useEffect(() => {
    if (isOpen && !successState) {
      getFilesFromServer()
        .then((files) => {
          setBugReportFileCount(files.size)
        })
        .catch((error) => {
          console.error("Failed to fetch file count", error)
          setBugReportFileCount(0)
        })
    }
  }, [isOpen, successState])

  const openBugReportDialog = useCallback(() => {
    setErrorMessage(null)
    setSuccessState(null)
    if (textareaRef.current) {
      textareaRef.current.value = ""
    }
    setIsOpen(true)
  }, [])

  const closeBugReportDialog = useCallback(() => {
    setIsOpen(false)
  }, [])

  const handleConfirmBugReport = useCallback(async () => {
    setIsSubmitting(true)
    setErrorMessage(null)

    const registryKy = getRegistryKy()
    const userText = textareaRef.current?.value || ""

    try {
      // Fetch files from the file server
      const filesFromServer = await getFilesFromServer()

      if (filesFromServer.size === 0) {
        toast.error("No project files available to include in the bug report")
        setIsSubmitting(false)
        return
      }

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

      for (const [filePath, fileContent] of filesFromServer.entries()) {
        const uploadPayload: {
          bug_report_id: string
          file_path: string
          content_text?: string
          content_base64?: string
        } = {
          bug_report_id: bugReportId,
          file_path: filePath,
        }

        // Add either text or binary content
        if (fileContent.text_content) {
          uploadPayload.content_text = fileContent.text_content
        }
        if (fileContent.binary_content_b64) {
          uploadPayload.content_base64 = fileContent.binary_content_b64
        }

        await registryKy.post("bug_reports/upload_file", {
          json: uploadPayload,
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
  }, [])

  const BugReportDialog = useMemo(() => {
    return (
      <AlertDialog
        key="bug-report-dialog"
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
                      ref={textareaRef}
                      id="bug-description"
                      className="rf-w-full rf-min-h-[100px] rf-px-3 rf-py-2 rf-text-sm rf-border rf-border-gray-300 rf-rounded-md focus:rf-outline-none focus:rf-ring-2 focus:rf-ring-blue-500"
                      placeholder="Describe the issue you're experiencing..."
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
    isOpen,
    isSubmitting,
    closeBugReportDialog,
    errorMessage,
    successState,
    bugReportFileCount,
    isSessionLoggedIn,
    handleConfirmBugReport,
  ])

  return {
    BugReportDialog,
    openBugReportDialog,
  }
}
