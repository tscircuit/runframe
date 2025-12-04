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

type UseBugReportDialogOptions = {
  onLoginRequired?: () => void
}

type FileContent = {
  text_content?: string
  binary_content_b64?: string
}

type UploadProgress = {
  current: number
  total: number
  currentFile: string
}

type FileUploadError = {
  filePath: string
  message: string
}

type UploadPayload = {
  bug_report_id: string
  file_path: string
  content_text?: string
  content_base64?: string
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

export const useBugReportDialog = (
  options?: UseBugReportDialogOptions,
): UseBugReportDialogResult => {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  )
  const [uploadErrors, setUploadErrors] = useState<FileUploadError[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [successState, setSuccessState] = useState<{
    bugReportUrl: string
  } | null>(null)
  const [bugReportFileCount, setBugReportFileCount] = useState<number>(0)
  const onLoginRequired = options?.onLoginRequired

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
    setUploadProgress(null)
    setUploadErrors([])
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
    setUploadProgress(null)
    setUploadErrors([])

    const registryKy = getRegistryKy()
    const userText = textareaRef.current?.value || ""

    try {
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
      const fileEntries = Array.from(filesFromServer.entries())
      const errors: FileUploadError[] = []

      for (let i = 0; i < fileEntries.length; i++) {
        const [filePath, fileContent] = fileEntries[i]

        setUploadProgress({
          current: i + 1,
          total: fileEntries.length,
          currentFile: filePath,
        })

        try {
          const uploadPayload: UploadPayload = {
            bug_report_id: bugReportId,
            file_path: filePath,
          }

          if (fileContent.text_content) {
            uploadPayload.content_text = fileContent.text_content
          }
          if (fileContent.binary_content_b64) {
            uploadPayload.content_base64 = fileContent.binary_content_b64
          }
          await registryKy.post("bug_reports/upload_file", {
            json: uploadPayload,
          })
        } catch (uploadError) {
          const errorMsg =
            uploadError instanceof HTTPError
              ? `HTTP ${uploadError.response.status}`
              : uploadError instanceof Error
                ? uploadError.message
                : "Upload failed"
          errors.push({ filePath, message: errorMsg })
          setUploadErrors([...errors])
        }
      }

      setUploadProgress(null)
      const bugReportUrl = buildBugReportUrl(bugReportId)
      setSuccessState({ bugReportUrl })
    } catch (error) {
      console.error("Failed to submit bug report", error)
      if (error instanceof HTTPError) {
        if (error.response.status === 401) {
          if (isSessionLoggedIn) {
            const message =
              "Your session has expired. Please sign in again to continue."
            setErrorMessage(message)
            toast.error(message)
            if (onLoginRequired) {
              closeBugReportDialog()
              onLoginRequired()
            }
          } else {
            const message =
              "You must be logged in to report a bug. Please sign in via cli and try again."
            setErrorMessage(message)
            toast.error(message)

            setTimeout(() => {
              if (onLoginRequired) {
                closeBugReportDialog()
                onLoginRequired()
              }
            }, 1000)
          }
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
  }, [isSessionLoggedIn, onLoginRequired])

  const BugReportDialog = useMemo(() => {
    const progressPercent = uploadProgress
      ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
      : 0

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
            setUploadProgress(null)
            setUploadErrors([])
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
                  {uploadErrors.length > 0 && (
                    <div className="rf-bg-red-50 rf-border rf-border-red-200 rf-rounded rf-p-2 rf-max-h-28 rf-overflow-y-auto rf-overflow-x-hidden">
                      <p className="rf-text-red-700 rf-font-medium rf-text-xs rf-mb-1">
                        {uploadErrors.length} file(s) failed:
                      </p>
                      {uploadErrors.map((err, idx) => (
                        <div
                          key={idx}
                          className="rf-text-red-600 rf-text-xs rf-mb-0.5"
                          title={`${err.filePath}: ${err.message}`}
                        >
                          <span className="rf-font-medium rf-break-all">
                            {err.filePath.split("/").pop()}
                          </span>
                          <span className="rf-text-red-500 rf-block rf-truncate">
                            {err.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
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
                  {uploadProgress ? (
                    <div className="rf-space-y-2 rf-overflow-hidden">
                      <div className="rf-flex rf-justify-between rf-text-xs">
                        <span>Uploading files...</span>
                        <span>
                          {uploadProgress.current}/{uploadProgress.total}
                        </span>
                      </div>
                      <div className="rf-w-full rf-h-2 rf-bg-gray-200 rf-rounded-full rf-overflow-hidden">
                        <div
                          className="rf-h-full rf-bg-blue-500 rf-transition-all rf-duration-150"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="rf-text-xs rf-text-gray-500 rf-break-all rf-truncate rf-w-full rf-max-w-full">
                        {`${uploadProgress.currentFile.slice(0, 60)}${uploadProgress.currentFile.length > 60 ? "..." : ""}`}
                      </p>
                      {uploadErrors.length > 0 && (
                        <div className="rf-bg-red-50 rf-border rf-border-red-200 rf-rounded rf-p-2 rf-max-h-20 rf-overflow-y-auto rf-overflow-x-hidden">
                          {uploadErrors.map((err, idx) => (
                            <div
                              key={idx}
                              className="rf-text-red-600 rf-text-xs rf-mb-0.5"
                              title={`${err.filePath}: ${err.message}`}
                            >
                              <span className="rf-font-medium rf-break-all">
                                {err.filePath.split("/").pop()}
                              </span>
                              <span className="rf-text-red-500 rf-block rf-truncate">
                                {err.message}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
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
                        Share the generated bug report link privately with
                        tscircuit staff so we can help debug your issue. You can
                        also reach out on our
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
                    </>
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
                {!isSessionLoggedIn && onLoginRequired ? (
                  <button
                    type="button"
                    className={buttonVariants()}
                    onClick={(event) => {
                      event.preventDefault()
                      closeBugReportDialog()
                      onLoginRequired()
                    }}
                  >
                    Sign In
                  </button>
                ) : (
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
                )}
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
    onLoginRequired,
    uploadProgress,
    uploadErrors,
  ])

  return {
    BugReportDialog,
    openBugReportDialog,
  }
}
