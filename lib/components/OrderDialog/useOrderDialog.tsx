import { useState } from "react"
import { OrderDialog } from "./OrderDialog"

type OrderStage = "initial" | "progress" | "checkout"

const OrderDialogComponent = ({
  isOpen,
  onClose,
  stage,
  setStage,
}: {
  isOpen: boolean
  onClose: () => void
  stage: OrderStage
  setStage: (stage: OrderStage) => void
}) => {
  return (
    <OrderDialog
      isOpen={isOpen}
      onClose={onClose}
      stage={stage}
      setStage={setStage}
    />
  )
}

export const useOrderDialog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [stage, setStage] = useState<OrderStage>("initial")
  const [isRegistryConnected, setIsRegistryConnected] = useState(false)

  const handleClose = () => {
    setIsOpen(false)
    setStage("initial")
  }

  return {
    isOpen,
    stage,
    isRegistryConnected,
    open: () => setIsOpen(true),
    close: handleClose,
    setStage,
    OrderDialog: OrderDialogComponent, // returns reference and not factory
  }
}
