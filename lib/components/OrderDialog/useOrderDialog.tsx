import type { CircuitJson } from "circuit-json"
import { CliOrderDialog } from "lib/components/OrderDialog/CliOrderDialog"
import { OrderDialog } from "lib/components/OrderDialog/OrderDialog"
import { useStyles } from "lib/hooks/use-styles"
import { useState } from "react"

type OrderStage = "initial" | "progress" | "checkout"

export const useOrderDialogCli = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [stage, setStage] = useState<OrderStage>("initial")

  const handleClose = () => {
    setIsOpen(false)
    setStage("initial")
  }

  return {
    isOpen,
    stage,
    open: () => setIsOpen(true),
    close: handleClose,
    setStage,
    OrderDialog: CliOrderDialog,
  }
}

export const useOrderDialog = ({
  onSignIn,
  isLoggedIn,
}: {
  onSignIn: () => void
  isLoggedIn: boolean
}) => {
  useStyles()

  const [isOpen, setIsOpen] = useState(false)
  const [stage, setStage] = useState<OrderStage>("initial")

  const handleClose = () => {
    setIsOpen(false)
    setStage("initial")
  }

  return {
    isOpen,
    stage,
    open: () => setIsOpen(true),
    close: handleClose,
    setStage,
    OrderDialog: (
      props: Omit<Parameters<typeof OrderDialog>[0], "signIn" | "isLoggedIn">,
    ) => <OrderDialog {...props} signIn={onSignIn} isLoggedIn={isLoggedIn} />,
  }
}
