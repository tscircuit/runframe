import type { RunFrameEvent } from "lib/components/RunFrameWithApi/types"
import { useEffect } from "react"

interface UseExportHandlerProps {
  isExporting: boolean
  setIsExporting: (value: boolean) => void
  requestToExportSentAt: number | null
  setRequestToExportSentAt: (value: number | null) => void
  recentEvents: RunFrameEvent[]
  setNotificationMessage: (message: string | null) => void
  setErrorMessage: (message: string) => void
  setIsError: (value: boolean) => void
}

export function useExportHandler({
  isExporting,
  setIsExporting,
  requestToExportSentAt,
  setRequestToExportSentAt,
  recentEvents,
  setNotificationMessage,
  setErrorMessage,
  setIsError,
}: UseExportHandlerProps) {
  useEffect(() => {
    if (!isExporting || requestToExportSentAt === null) return

    const eventsSinceRequestToExport = recentEvents
      .toReversed()
      .filter(
        (event) => new Date(event.created_at).valueOf() > requestToExportSentAt,
      )
    const exportFailedEvent = eventsSinceRequestToExport
      .toReversed()
      .find((event) => event.event_type === "FAILED_TO_EXPORT")
    const exportSuccessEvent = eventsSinceRequestToExport.find(
      (event) => event.event_type === "EXPORT_CREATED",
    )

    if (exportFailedEvent) {
      setIsExporting(false)
      setRequestToExportSentAt(null)
      setNotificationMessage(null)
      setErrorMessage(
        exportFailedEvent.message ??
          "Failed to export snippet. See console for error.",
      )
      console.error(exportFailedEvent.message)
      setIsError(true)
    }

    if (exportSuccessEvent) {
      setIsExporting(false)
      setRequestToExportSentAt(null)
      setIsError(false)

      if (
        exportSuccessEvent.binaryData &&
        exportSuccessEvent.fileName &&
        exportSuccessEvent.mimeType
      ) {
        try {
          const byteArray = Uint8Array.from(
            atob(exportSuccessEvent.binaryData),
            (char) => char.charCodeAt(0),
          )
          const blob = new Blob([byteArray], {
            type: exportSuccessEvent.mimeType,
          })
          const link = document.createElement("a")
          link.href = URL.createObjectURL(blob)
          link.download = exportSuccessEvent.fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          setNotificationMessage(
            `Exported successfully: ${exportSuccessEvent.fileName}`,
          )
        } catch (error) {
          console.log("useExportHandler: error in try block")
          console.error("Error decoding file for download:", error)
          setErrorMessage("Exported file could not be downloaded.")
          setIsError(true)
          setNotificationMessage(null)
        }
      } else {
        setNotificationMessage(`Export downloaded successfully!`)
      }
    }
  }, [recentEvents, isExporting, requestToExportSentAt])
}
