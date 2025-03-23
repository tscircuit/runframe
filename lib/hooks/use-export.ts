import type {
  RunFrameEvent,
  RunFrameEventInput,
} from "lib/components/RunFrameWithApi/types"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"

interface UseExportHandlerProps {
  requestToExportSentAt: number | null
  setRequestToExportSentAt: (value: number | null) => void
  recentEvents: RunFrameEvent[]
  setIsError: (value: boolean) => void
  pushEvent: (event: RunFrameEventInput) => Promise<void>
}

export function useExportHandler({
  requestToExportSentAt,
  setRequestToExportSentAt,
  recentEvents,
  setIsError,
  pushEvent,
}: UseExportHandlerProps) {
  const [isExporting, setIsExporting] = useState(false)

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
      toast.error(
        exportFailedEvent.message ??
          "Failed to export snippet. See console for error.",
      )
      console.error(exportFailedEvent.message)
    }

    if (exportSuccessEvent) {
      setIsExporting(false)
      setRequestToExportSentAt(null)
      setIsError(false)
      if (exportSuccessEvent.outputFilePath) {
        toast.success("Export download started...")
        window.open(
          `/api/files/download?file_path=${encodeURIComponent(exportSuccessEvent.outputFilePath)}`,
          "_blank",
        )
      }
    }
  }, [recentEvents, isExporting, requestToExportSentAt])

  return {
    isExporting,
    setIsExporting,
    startExport: async (exportType: string) => {
      toast.loading("Export processing...", { duration: 500 })
      setIsExporting(true)
      await pushEvent({
        event_type: "REQUEST_EXPORT",
        exportType: exportType,
      }).then(() => {
        const exportReqTime = new Date().valueOf() - 5000
        setRequestToExportSentAt(exportReqTime)
        setIsError(false)
      })
    },
  }
}
