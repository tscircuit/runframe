import { useEffect } from "react"
import { posthog } from "lib/utils"
import { getWindowVar } from "lib/utils/get-registry-ky"
import type { CircuitJsonError } from "circuit-json"

interface UseErrorTelemetryParams {
  errorMessage?: string | null | undefined
  errorStack?: string | null | undefined
  circuitJsonErrors?: CircuitJsonError[] | null | undefined
}

export const useErrorTelemetry = ({
  errorMessage,
  errorStack,
  circuitJsonErrors,
}: UseErrorTelemetryParams) => {
  useEffect(() => {
    if (getWindowVar("TSCIRCUIT_TELEMETRY_DISABLED") === true) return
    if (errorMessage) {
      const err = new Error(errorMessage)
      if (errorStack) err.stack = errorStack
      try {
        posthog.captureException(err)
      } catch {
        // ignore analytics errors
      }
    }
  }, [errorMessage, errorStack])

  useEffect(() => {
    if (getWindowVar("TSCIRCUIT_TELEMETRY_DISABLED") === true) return
    if (circuitJsonErrors && circuitJsonErrors.length > 0) {
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
  }, [circuitJsonErrors])
}
