import { Dialog, DialogContent } from "lib/components/ui/dialog"
import type { FC } from "react"
import { QueryClient, QueryClientProvider } from "react-query"
import { InitialOrderScreen } from "./InitialOrder"
import type { CircuitJson } from "circuit-json"

const queryClient = new QueryClient()
export interface OrderDialogProps {
  isOpen: boolean
  onClose: () => void
  stage: "initial" | "progress" | "checkout"
  setStage: (stage: "initial" | "progress" | "checkout") => void
  circuitJson?: CircuitJson
  packageReleaseId?: string
  signIn: () => void
}

export const OrderDialog: FC<OrderDialogProps> = ({
  isOpen,
  onClose,
  stage,
  setStage,
  circuitJson,
  packageReleaseId,
  signIn,
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <DialogContent className="!rf-max-w-[660px] !rf-p-0">
          <div className="rf-relative rf-w-full">
            {stage === "initial" && (
              <InitialOrderScreen
                onCancel={onClose}
                packageReleaseId={packageReleaseId ?? ""}
                signIn={signIn}
              />
            )}

            {/* {stage === "progress" && order?.order_id && (
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
            )} */}
          </div>
        </DialogContent>
      </Dialog>
    </QueryClientProvider>
  )
}
