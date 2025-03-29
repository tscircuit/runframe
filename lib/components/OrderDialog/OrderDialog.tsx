import ky from "ky"
import { AlertDialog, AlertDialogContent } from "lib/components/ui/alert-dialog"
import type { FC } from "react"
import { useState } from "react"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import { CheckoutOrder } from "./CheckoutOrder"
import { InitialOrderScreen } from "./InitialOrder"
import { type Step, StepwiseProgressPanel } from "./StepwiseProgress"

interface OrderDialogProps {
  isOpen: boolean
  onClose: () => void
  stage: "initial" | "progress" | "checkout"
  setStage: (stage: "initial" | "progress" | "checkout") => void
}

const orderSteps: Step[] = [
  { order_step_id: 1, key: "are_gerbers_generated", title: "Generate Gerbers" },
  { order_step_id: 2, key: "are_gerbers_uploaded", title: "Upload Gerbers" },
  { order_step_id: 3, key: "is_gerber_analyzed", title: "Analyze Gerber" },
  {
    order_step_id: 4,
    key: "are_initial_costs_calculated",
    title: "Calculate Initial Costs",
  },
  { order_step_id: 5, key: "is_pcb_added_to_cart", title: "Add PCB to Cart" },
  { order_step_id: 6, key: "is_bom_uploaded", title: "Upload BOM" },
  { order_step_id: 7, key: "is_pnp_uploaded", title: "Upload PnP" },
  { order_step_id: 8, key: "is_bom_pnp_analyzed", title: "Analyze BOM & PnP" },
  {
    order_step_id: 9,
    key: "is_bom_parsing_complete",
    title: "BOM Parsing Complete",
  },
  {
    order_step_id: 10,
    key: "are_components_available",
    title: "Components Available",
  },
  {
    order_step_id: 11,
    key: "is_patch_map_generated",
    title: "Generate Patch Map",
  },
  {
    order_step_id: 12,
    key: "is_json_merge_file_created",
    title: "Create JSON Merge File",
  },
  {
    order_step_id: 13,
    key: "is_dfm_result_generated",
    title: "Generate DFM Result",
  },
  { order_step_id: 14, key: "are_files_downloaded", title: "Download Files" },
  {
    order_step_id: 15,
    key: "are_product_categories_fetched",
    title: "Fetch Product Categories",
  },
  {
    order_step_id: 16,
    key: "are_final_costs_calculated",
    title: "Calculate Final Costs",
  },
  {
    order_step_id: 17,
    key: "is_json_merge_file_updated",
    title: "Update JSON Merge File",
  },
  { order_step_id: 18, key: "is_added_to_cart", title: "Add to Cart" },
].map((step, index) => ({
  ...step,
  completed: false,
  active: index === 0, // First step starts as active
}))

export const OrderDialog: FC<OrderDialogProps> = ({
  isOpen,
  onClose,
  stage,
  setStage,
}) => {
  const [order, setOrder] = useState<any>(null)
  const [orderState, setOrderState] = useState<any>(null)
  const [steps, setSteps] = useState<Step[]>(orderSteps)
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

  const getOrderState = async (orderId: string) => {
    let response: any
    try {
      response = await ky
        .get("registry/orders/get", {
          searchParams: {
            order_id: orderId,
            ...(simulateScenarioOrder
              ? { _simulate_scenario: simulateScenarioOrder }
              : {}),
          },
          headers: {
            Authorization: `Bearer account-1234`,
          },
        })
        .json()
    } catch (error) {
      console.error(error)
    }

    setOrder(response.order)
    setOrderState(response.orderState)
    setStage("progress")
  }

  const handleProgressContinue = async () => {
    setLoading(true)
    try {
      // Simulate some async work
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSteps((currentSteps) => {
        const activeStepIndex = currentSteps.findIndex((step) => step.active)
        if (activeStepIndex === -1) return currentSteps

        const newSteps = [...currentSteps]
        // Complete current step
        newSteps[activeStepIndex] = {
          ...newSteps[activeStepIndex],
          completed: true,
          active: false,
        }

        // If this was the last step, move to checkout
        if (activeStepIndex === currentSteps.length - 1) {
          setTimeout(() => setStage("checkout"), 500) // Small delay to show completion
        } else {
          // Activate next step
          newSteps[activeStepIndex + 1] = {
            ...newSteps[activeStepIndex + 1],
            active: true,
          }
        }

        return newSteps
      })
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  const handleInitialContinue = () => {
    setStage("progress")
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="!rf-max-w-[660px] !rf-p-0">
        <div className="rf-relative rf-w-full">
          {stage === "initial" && (
            <InitialOrderScreen
              onCancel={onClose}
              onContinue={handleInitialContinue}
            />
          )}

          {stage === "progress" && (
            <StepwiseProgressPanel
              steps={steps}
              onCancel={onClose}
              onContinue={handleProgressContinue}
              loading={loading}
            />
          )}

          {stage === "checkout" && (
            <CheckoutOrder
              finalCost={0}
              onConfirmCheckout={() => onClose()}
              onBack={() => setStage("progress")}
            />
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
