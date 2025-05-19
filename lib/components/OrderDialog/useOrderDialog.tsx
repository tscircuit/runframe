import { CliOrderDialog } from "lib/components/OrderDialog/CliOrderDialog"
import { OrderDialog } from "lib/components/OrderDialog/OrderDialog"
import { useStyles } from "lib/hooks/use-styles"
import { useState, useMemo, useCallback } from "react"

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
  packageReleaseId,
}: {
  onSignIn: () => void
  isLoggedIn: boolean
  packageReleaseId: string
}) => {
  useStyles()

  const [isOpen, setIsOpen] = useState(false)
  const [stage, setStage] = useState<OrderStage>("initial")

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setStage("initial")
  }, [])

  const open = useCallback(() => setIsOpen(true), [])

  const MemoizedOrderDialog = useMemo(() => {
    return (
      props: Omit<Parameters<typeof OrderDialog>[0], "signIn" | "isLoggedIn">,
    ) => <OrderDialog {...props} signIn={onSignIn} isLoggedIn={isLoggedIn} packageReleaseId={packageReleaseId} />
  }, [isLoggedIn, packageReleaseId])

  return {
    isOpen,
    stage,
    open,
    close: handleClose,
    setStage,
    OrderDialog: MemoizedOrderDialog,
  }
}
