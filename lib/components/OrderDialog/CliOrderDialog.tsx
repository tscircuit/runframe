import type { FC } from "react"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import { OrderDialog } from "./OrderDialog"

interface CliOrderDialogProps {
  isOpen: boolean
  onClose: () => void
  stage: "initial" | "progress" | "checkout"
  setStage: (stage: "initial" | "progress" | "checkout") => void
}

export const CliOrderDialog: FC<CliOrderDialogProps> = ({
  isOpen,
  onClose,
  stage,
  setStage,
}) => {
  const circuitJson = useRunFrameStore((state) => state.circuitJson)

  return (
    <OrderDialog
      isOpen={isOpen}
      onClose={onClose}
      stage={stage}
      setStage={setStage}
      circuitJson={circuitJson!}
    />
  )
}
