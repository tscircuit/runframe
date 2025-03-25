import { useState } from "react"

export const useOrderDialog = () => {
  const [isOpen, setIsOpen] = useState(false)

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    OrderDialog: () => {
      return <OrderDialog />
    },
  }
}
