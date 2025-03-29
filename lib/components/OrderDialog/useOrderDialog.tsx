import { useState } from "react"
import { OrderDialog } from "./OrderDialog"

type OrderStage = "initial" | "progress" | "checkout"

export const useOrderDialog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [stage, setStage] = useState<OrderStage>("initial")
  const [isRegistryConnected, setIsRegistryConnected] = useState(false)

  const handleClose = () => {
    setIsOpen(false)
    setStage("initial") // Reset stage when dialog closes
  }

  return {
    isOpen,
    stage,
    isRegistryConnected,
    open: () => setIsOpen(true),
    close: handleClose,
    setStage,
    OrderDialog: () => {
      return (
        <OrderDialog 
          isOpen={isOpen} 
          onClose={handleClose}
          stage={stage}
          setStage={setStage}
        />
      )
    },
  }
}
