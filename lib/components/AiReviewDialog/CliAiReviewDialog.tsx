import { AiReviewDialog } from "./AiReviewDialog"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import type { FC } from "react"

interface CliAiReviewDialogProps {
  isOpen: boolean
  onClose: () => void
  packageName: string
}

export const CliAiReviewDialog: FC<CliAiReviewDialogProps> = ({
  isOpen,
  onClose,
  packageName,
}) => {
  const fsMap = useRunFrameStore((s) => s.fsMap)
  const circuitJson = useRunFrameStore((s) => s.circuitJson)

  return (
    <AiReviewDialog
      isOpen={isOpen}
      onClose={onClose}
      packageName={packageName}
      fsMap={fsMap}
      circuitJson={circuitJson}
    />
  )
}
