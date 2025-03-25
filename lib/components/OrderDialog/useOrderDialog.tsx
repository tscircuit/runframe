import { useState, useEffect } from "react"
import { OrderDialog } from "./OrderDialog"

export const useOrderDialog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isRegistryConnected, setIsRegistryConnected] = useState(false)

  return {
    isOpen,
    isRegistryConnected,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    OrderDialog: () => {
      return <OrderDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    },
  }
}
