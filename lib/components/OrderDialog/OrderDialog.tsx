import React, { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import { Checkbox } from "../ui/checkbox"
import ky from "ky"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import { Button } from "../ui/button"

interface Order {
  order_id: string
}

interface OrderDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const OrderDialog: React.FC<OrderDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [order, setOrder] = useState<Order | null>(null)
  const [stage, setStage] = useState<"setup" | "order-progress" | "finished">(
    "setup",
  )

  const circuitJson = useRunFrameStore((state) => state.circuitJson)

  // TODO submit

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Order PCB</AlertDialogTitle>
          <AlertDialogDescription>{stage}</AlertDialogDescription>
        </AlertDialogHeader>

        {stage === "order-progress" && (
          <div className="rf-space-y-4 rf-py-4 ">
            <pre
              style={{
                maxHeight: "500px",
                overflowY: "scroll",
                fontSize: "8px",
              }}
            >
              {JSON.stringify(order, null, 2)}
            </pre>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          {stage === "setup" && (
            <Button
              onClick={async () => {
                if (!circuitJson) {
                  // toast.error("No circuit JSON found")
                  return
                }
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

                setOrder(order)
                setStage("order-progress")
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
