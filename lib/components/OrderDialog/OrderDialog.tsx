import ky from "ky"
import { AlertDialog, AlertDialogContent } from "lib/components/ui/alert-dialog"
import type { FC } from "react"
import { useState } from "react"
import { QueryClient, QueryClientProvider } from "react-query"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import { CheckoutOrder } from "./CheckoutOrder"
import { InitialOrderScreen } from "./InitialOrder"
import { StepwiseProgressPanel } from "./StepwiseProgress"

const queryClient = new QueryClient()
interface OrderDialogProps {
  isOpen: boolean
  onClose: () => void
  stage: "initial" | "progress" | "checkout"
  setStage: (stage: "initial" | "progress" | "checkout") => void
}

export const OrderDialog: FC<OrderDialogProps> = ({
  isOpen,
  onClose,
  stage,
  setStage,
}) => {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const circuitJson = useRunFrameStore((state) => state.circuitJson)
  const simulateScenarioOrder = useRunFrameStore(
    (state) => state.simulateScenarioOrder,
  )

  const createOrder = async () => {
    const { order } = await ky
      .post("registry/orders/create", {
        json: {
          circuit_json: circuitJson,
        },
        headers: {
          Authorization: `Bearer account-1234`,
        },
      })
      .json<{ order: any }>()
    return order
  }

  const handleInitialContinue = async () => {
    const order = await createOrder()
    setOrder(order)
    setStage("progress")
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="!rf-max-w-[660px] !rf-p-0">
          <div className="rf-relative rf-w-full">
          {stage === "initial" && (
            <InitialOrderScreen
              onCancel={onClose}
              onContinue={handleInitialContinue}
            />
          )}

          {stage === "progress" && order?.order_id && (
            <StepwiseProgressPanel
              onCancel={onClose}
              loading={loading}
              orderId={order?.order_id}
              setStage={setStage}
            />
          )}

          {stage === "checkout" && (
            <CheckoutOrder
              finalCost={0}
              onConfirmCheckout={() => onClose()}
              onCancel={() => onClose()}
            />
          )}
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </QueryClientProvider>
  )
}
