import type { FC } from "react"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import { OrderDialog } from "./OrderDialog"

export interface CliOrderDialogProps {
  isOpen: boolean
  onClose: () => void
  stage: "initial" | "progress" | "checkout"
  setStage: (stage: "initial" | "progress" | "checkout") => void
  signIn?: () => void
}

export const CliOrderDialog: FC<CliOrderDialogProps> = ({
  isOpen,
  onClose,
  stage,
  setStage,
  signIn,
}) => {
  const circuitJson = useRunFrameStore((state) => state.circuitJson)

  return (
    <OrderDialog
      signIn={signIn}
      isOpen={isOpen}
      onClose={onClose}
      stage={stage}
      setStage={setStage}
      circuitJson={circuitJson!}
    />
  )
}
