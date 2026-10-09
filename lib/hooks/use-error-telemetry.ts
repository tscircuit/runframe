import { useEffect } from "react"
import { posthog } from "lib/utils"
import { initPostHog } from "lib/utils/posthog"
import type { CircuitJsonError } from "circuit-json"

interface UseErrorTelemetryParams {
  disabled?: boolean
  errorMessage?: string | null | undefined
  errorStack?: string | null | undefined
  circuitJsonErrors?: CircuitJsonError[] | null | undefined
}

export const useErrorTelemetry = ({
  errorMessage,
  errorStack,
  circuitJsonErrors,
  disabled,
}: UseErrorTelemetryParams) => {
  useEffect(() => {
    if (!disabled && errorMessage && initPostHog()) {
      const err = new Error(errorMessage)
      if (errorStack) err.stack = errorStack
      try {
        posthog.captureException(err)
      } catch {
        // ignore analytics errors
      }
    }
  }, [disabled, errorMessage, errorStack])

  useEffect(() => {
    if (
      !disabled &&
      circuitJsonErrors &&
      circuitJsonErrors.length > 0 &&
      initPostHog()
    ) {
      for (const error of circuitJsonErrors) {
        const err = new Error(error.message || "Circuit JSON Error")
        if ((error as any).stack) {
          ;(err as any).stack = (error as any).stack
        }
        try {
          posthog.captureException(err, { error_type: error.type })
        } catch {
          // ignore analytics errors
        }
      }
    }
  }, [disabled, circuitJsonErrors])
}
