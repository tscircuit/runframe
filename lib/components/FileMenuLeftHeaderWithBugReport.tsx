import { memo } from "react"
import { FileMenuLeftHeader } from "./FileMenuLeftHeader"
import { useBugReportDialog } from "./useBugReportDialog"

/**
 * Wrapper component that manages bug report dialog state separately
 * from FileMenuLeftHeader to prevent unnecessary re-renders
 */
const FileMenuLeftHeaderWithBugReportComponent = (props: {
  isWebEmbedded?: boolean
  shouldLoadLatestEval?: boolean
  onChangeShouldLoadLatestEval?: (shouldLoadLatestEval: boolean) => void
  circuitJson?: any
  projectName?: string
}) => {
  const { BugReportDialog, openBugReportDialog } = useBugReportDialog()

  return (
    <>
      <FileMenuLeftHeader
        {...props}
        openBugReportDialog={openBugReportDialog}
      />
      {BugReportDialog}
    </>
  )
}

export const FileMenuLeftHeaderWithBugReport = memo(
  FileMenuLeftHeaderWithBugReportComponent,
)
