import ky from "ky"
import type React from "react"
import { useState } from "react"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import { Button } from "../ui/button"
import { toast } from "react-hot-toast"
import { ErrorTabContent } from "../ErrorTabContent/ErrorTabContent"
import { Checkbox } from "../ui/checkbox"


interface OrderDialogProps {
  isOpen: boolean
  onClose: () => void
}

const orderSteps = [
  { key: "are_gerbers_generated", label: "Generate Gerbers" },
  { key: "are_gerbers_uploaded", label: "Upload Gerbers" },
  { key: "is_gerber_analyzed", label: "Analyze Gerber" },
  { key: "are_initial_costs_calculated", label: "Calculate Initial Costs" },
  { key: "is_pcb_added_to_cart", label: "Add PCB to Cart" },
  { key: "is_bom_uploaded", label: "Upload BOM" },
  { key: "is_pnp_uploaded", label: "Upload PnP" },
  { key: "is_bom_pnp_analyzed", label: "Analyze BOM & PnP" },
  { key: "is_bom_parsing_complete", label: "BOM Parsing Complete" },
  { key: "are_components_available", label: "Components Available" },
  { key: "is_patch_map_generated", label: "Generate Patch Map" },
  { key: "is_json_merge_file_created", label: "Create JSON Merge File" },
  { key: "is_dfm_result_generated", label: "Generate DFM Result" },
  { key: "are_files_downloaded", label: "Download Files" },
  {
    key: "are_product_categories_fetched",
    label: "Fetch Product Categories",
  },
  { key: "are_final_costs_calculated", label: "Calculate Final Costs" },
  { key: "is_json_merge_file_updated", label: "Update JSON Merge File" },
  { key: "is_added_to_cart", label: "Add to Cart" },
]

export const OrderDialog: React.FC<OrderDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [order, setOrder] = useState<any>(null)
  const [orderState, setOrderState] = useState<any>(null)
  const [stage, setStage] = useState<"setup" | "order-progress" | "finished">(
    "setup",
  )
  const [simulateScenario, setSimulateScenario] = useState<any>(null)

  const circuitJson = useRunFrameStore((state) => state.circuitJson)

  const simulate = window.location.hostname === "localhost"

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
          ...(simulateScenario ? { _simulate_scenario: simulateScenario } : {}),
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
    setStage("order-progress")
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Order PCB</AlertDialogTitle>
        </AlertDialogHeader>

        {stage === "setup" && simulate && (
          <div className="rf-flex rf-items-center">
            <label
              htmlFor="scenario"
              className="rf-mr-2 rf-text-gray-700 rf-text-sm"
            >
              Scenario:
            </label>
            <select
              id="scenario"
              className="rf-bg-white rf-border rf-border-gray-300 rf-rounded-md rf-shadow-sm rf-px-3 rf-py-1.5 rf-text-sm focus:rf-outline-none focus:rf-ring-2 focus:rf-ring-blue-500 focus:rf-border-blue-500"
              defaultValue="None"
              onChange={(e) => setSimulateScenario(e.target.value)}
            >
              <option value="none">None</option>
              {orderSteps.map((stage) => (
                <option key={stage.key} value={stage.key}>
                  {stage.label} Failed
                </option>
              ))}
            </select>
          </div>
        )}

        {stage === "order-progress" && (
          <>
            <div className="rf-grid rf-grid-cols-2 rf-gap-4 rf-py-4">
              {orderSteps.map((stage, indx) => (
                <div key={stage.key} className="rf-flex rf-items-center">
                  <Checkbox
                    checked={orderState?.[stage.key]}
                    id={`checkbox-${stage.key}`}
                  />
                  <label htmlFor={`checkbox-${stage.key}`} className="rf-ml-2">
                    <h3>{indx + 1}. {stage.label}</h3>
                  </label>
                </div>
              ))}
            </div>
            <div className="rf-space-y-4 rf-py-4 ">
              {order?.error && (
                <ErrorTabContent
                  code={order.error.error_code}
                  errorMessage={order.error.message}
                />
              )}
            </div>
          </>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          {stage === "setup" && (
            <Button
              onClick={async () => {
                if (!circuitJson) {
                  toast.error("No circuit JSON found")
                  return
                }
                const order = await createOrder()
                getOrderState(order.order_id)
              }}
            >
              Submit Order
            </Button>
          )}
          {stage === "order-progress" && (
            <Button disabled>Continue to Shipping</Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
