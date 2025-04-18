import { AlertDialog, AlertDialogContent } from "lib/components/ui/alert-dialog"
import type { FC } from "react"
import { useState } from "react"
import { QueryClient, QueryClientProvider } from "react-query"
import { CheckoutOrder } from "./CheckoutOrder"
import { InitialOrderScreen } from "./InitialOrder"
import { StepwiseProgressPanel } from "./StepwiseProgress"
import type { CircuitJson } from "circuit-json"
import ky from "ky"
import { useStyles } from "lib/hooks/use-styles"
import { registryKy } from "lib/utils/get-registry-ky"

const queryClient = new QueryClient()
export interface OrderDialogProps {
  isOpen: boolean
  onClose: () => void
  stage: "initial" | "progress" | "checkout"
  setStage: (stage: "initial" | "progress" | "checkout") => void
  circuitJson?: CircuitJson
}

export const OrderDialog: FC<OrderDialogProps> = ({
  isOpen,
  onClose,
  stage,
  setStage,
  circuitJson,
}) => {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const createOrder = async (sessionId?: string) => {
    const { order } = await registryKy
      .post("orders/create", {
        json: {
          circuit_json: circuitJson,
        },
        headers: {
          Authorization: `Bearer ${sessionId ?? "account-1234"}`,
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
                // TODO: Redirect to stripe
                onConfirmCheckout={onClose}
                onCancel={onClose}
              />
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </QueryClientProvider>
  )
}
