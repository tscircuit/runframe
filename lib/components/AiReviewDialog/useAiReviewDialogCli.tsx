import { useState } from "react"
import { CliAiReviewDialog } from "./CliAiReviewDialog"

export const useAiReviewDialogCli = () => {
  const [isOpen, setIsOpen] = useState(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  const AiReviewDialog = (props: { packageName: string }) => (
    <CliAiReviewDialog
      isOpen={isOpen}
      onClose={close}
      packageName={props.packageName}
    />
  )

  return { isOpen, open, close, AiReviewDialog }
}
