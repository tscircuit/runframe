import { Check, ArrowRight, Loader2, ArrowDown } from "lucide-react"
import { Progress } from "lib/components/ui/progress"
import { Button } from "lib/components/ui/button"

export type Step = {
  order_step_id: number
  title: string
  completed: boolean
  active?: boolean
}

interface StepwiseProgressPanelProps {
  steps: Step[]
  title?: string
  onCancel?: () => void
  onContinue?: () => void
  continueButtonText?: string
  cancelButtonText?: string
  loading?: boolean
}

export const StepwiseProgressPanel = ({
  steps,
  title = "Order PCB",
  onCancel,
  onContinue,
  continueButtonText = "Continue",
  cancelButtonText = "Cancel",
  loading = false,
}: StepwiseProgressPanelProps) => {
  const completedSteps = steps.filter((step) => step.completed)
  const activeStep = steps.find((step) => step.active)
  const totalSteps = steps.length
  const progress = Math.round((completedSteps.length / totalSteps) * 100)

  const displayedCompletedSteps = completedSteps.slice(-1)

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
        {displayedCompletedSteps.map((step, index) => (
          <div
            key={step.order_step_id}
            className="rf-flex rf-items-start rf-gap-4"
          >
            <div className="rf-flex-shrink-0 rf-mt-0.5">
              <div className="rf-w-8 rf-h-8 rf-rounded-full rf-bg-green-100 rf-flex rf-items-center rf-justify-center">
                <Check className="rf-h-5 rf-w-5 rf-text-green-600" />
              </div>
            </div>
            <div className="rf-flex-1">
              <p className="rf-text-sm rf-font-medium rf-text-muted-foreground">
                {index === displayedCompletedSteps.length - 1
                  ? "Last Completed"
                  : "Completed"}
              </p>
              <p className="rf-font-medium rf-text-green-600">
                {step.order_step_id}. {step.title}
              </p>
            </div>
          </div>
        ))}

        {completedSteps.length > 0 && activeStep && (
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
            {cancelButtonText}
          </Button>
        )}
        {onContinue && (
          <Button
            onClick={onContinue}
            className="rf-px-6 rf-bg-gray-700 rf-hover:bg-gray-800"
            disabled={loading || !activeStep}
          >
            {loading ? (
              <>
                <Loader2 className="rf-mr-2 rf-h-4 rf-w-4 rf-animate-spin" />
                Processing...
              </>
            ) : (
              continueButtonText
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
