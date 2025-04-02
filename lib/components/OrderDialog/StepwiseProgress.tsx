import ky from "ky"
import { Button } from "lib/components/ui/button"
import { Progress } from "lib/components/ui/progress"
import { ArrowDown, Check, Loader2 } from "lucide-react"
import { useQuery } from "react-query"
import { orderSteps } from "lib/utils/order-steps"

export type Step = {
  order_step_id: number
  key: string
  title: string
  completed: boolean
  active?: boolean
}

interface StepwiseProgressPanelProps {
  orderId: string
  title?: string
  onCancel?: () => void
  loading?: boolean
  setStage: (stage: "initial" | "progress" | "checkout") => void
}

interface OrderState {
  order: {
    order_id: string
    is_finished: boolean
    completed_at?: string
  }
  orderState: {
    [key: string]: boolean
    current_step: any
  }
}

export const StepwiseProgressPanel = ({
  orderId,
  title = "Order PCB",
  onCancel,
  loading: externalLoading = false,
  setStage,
}: StepwiseProgressPanelProps) => {
  const { data, isLoading } = useQuery<OrderState>({
    queryKey: ["orderState", orderId],
    queryFn: async () => {
      const response: OrderState = await ky
        .get("registry/orders/get", {
          searchParams: { order_id: orderId },
          headers: {
            Authorization: `Bearer account-1234`,
          },
        })
        .json()

      if (response.orderState.current_step === "is_added_to_cart") {
        setStage("checkout")
      }

      return response
    },
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
  })

  const steps = orderSteps.map((step) => {
    if (!data?.orderState) return step

    // Find current step index
    const currentStepIndex = orderSteps.findIndex(
      (orderStep) => orderStep.key === data.orderState.current_step,
    )
    const stepIndex = orderSteps.findIndex(
      (orderStep) => orderStep.key === step.key,
    )

    return {
      ...step,
      completed: stepIndex < currentStepIndex,
      active: stepIndex === currentStepIndex,
    }
  })

  const completedSteps = steps.filter((step) => step.completed)
  const activeStep = steps.find((step) => step.active)
  const lastCompletedStep = completedSteps[completedSteps.length - 1]
  const totalSteps = steps.length
  const progress = Math.round((completedSteps.length / totalSteps) * 100)

  const loading = isLoading || externalLoading

  return (
    <div className="rf-flex rf-flex-col rf-bg-white rf-rounded-xl rf-p-6 rf-max-w-xl rf-w-full rf-mx-auto">
      <div className="rf-flex rf-items-center rf-justify-between rf-mb-6">
        <h2 className="rf-text-2xl rf-font-bold">{title}</h2>
        <div className="rf-text-sm rf-text-muted-foreground">
          {completedSteps.length} of {totalSteps} completed
        </div>
      </div>

      <Progress value={progress} className="rf-h-2 rf-mb-8" />

      <div className="rf-space-y-6 rf-mb-8">
        {lastCompletedStep && (
          <div className="rf-flex rf-items-start rf-gap-4">
            <div className="rf-flex-shrink-0 rf-mt-0.5">
              <div className="rf-w-8 rf-h-8 rf-rounded-full rf-bg-green-100 rf-flex rf-items-center rf-justify-center">
                <Check className="rf-h-5 rf-w-5 rf-text-green-600" />
              </div>
            </div>
            <div className="rf-flex-1">
              <p className="rf-text-sm rf-font-medium rf-text-muted-foreground">
                Last Completed
              </p>
              <p className="rf-font-medium rf-text-green-600">
                {lastCompletedStep.order_step_id}. {lastCompletedStep.title}
              </p>
            </div>
          </div>
        )}

        {lastCompletedStep && activeStep && (
          <div className="rf-pl-4">
            <ArrowDown className="rf-h-5 rf-w-5 rf-text-muted-foreground" />
          </div>
        )}

        {activeStep && (
          <div className="rf-flex rf-items-start rf-gap-4">
            <div className="rf-flex-shrink-0 rf-mt-0.5">
              <div className="rf-w-8 rf-h-8 rf-rounded-full rf-bg-blue-100 rf-flex rf-items-center rf-justify-center">
                {loading ? (
                  <Loader2 className="rf-h-5 rf-w-5 rf-text-blue-600 rf-animate-spin" />
                ) : (
                  <div className="rf-h-2.5 rf-w-2.5 rf-rounded-full rf-bg-blue-600" />
                )}
              </div>
            </div>
            <div className="rf-flex-1">
              <p className="rf-text-sm rf-font-medium rf-text-muted-foreground">
                Current Step
              </p>
              <p className="rf-font-medium rf-text-blue-600">
                {activeStep.order_step_id}. {activeStep.title}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="rf-flex rf-justify-end rf-gap-3 rf-mt-auto">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="rf-px-6">
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
