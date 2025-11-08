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
  signIn?: () => void
  isLoggedIn: boolean
}

export const OrderDialog: FC<OrderDialogProps> = ({
  isOpen,
  onClose,
  stage,
  setStage,
  circuitJson,
  packageReleaseId,
  signIn,
  isLoggedIn,
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <DialogContent
          className="
          !rf-p-0 !rf-z-[101] rf-rounded-md
          !rf-w-[95vw] !rf-max-w-[95vw]
          sm:rf-w-[90vw] sm:rf-max-w-[500px]
          md:rf-w-auto md:rf-max-w-[660px]
          lg:rf-max-w-[720px]
          xl:rf-max-w-[800px]
          rf-max-h-[90vh] rf-overflow-y-auto
        "
        >
          <div className="rf-relative rf-w-full">
            {stage === "initial" && (
              <InitialOrderScreen
                onCancel={onClose}
                packageReleaseId={packageReleaseId ?? ""}
                signIn={signIn ?? (() => {})}
                isLoggedIn={isLoggedIn}
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
