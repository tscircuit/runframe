import { useEffect } from "react"
import { posthog } from "lib/utils"
import { getCircuitJsonErrorFingerprint } from "lib/utils/get-circuit-json-error-fingerprint"
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
    if (circuitJsonErrors && circuitJsonErrors.length > 0) {
      for (const error of circuitJsonErrors) {
        const err = new Error(error.message || "Circuit JSON Error")
        if ((error as any).stack) {
          ;(err as any).stack = (error as any).stack
        }
        try {
          // Group every circuit-JSON DRC error of the same type into a single
          // error-tracking issue. Without an explicit fingerprint, messages that
          // interpolate per-trace / per-component display names each produce a
          // unique fingerprint, spawning thousands of issues for what is really
          // one DRC condition (e.g. a trace the autorouter couldn't route).
          posthog.captureException(err, {
            error_type: error.type,
            $exception_fingerprint: getCircuitJsonErrorFingerprint(error),
          })
        } catch {
          // ignore analytics errors
        }
      }
    }
  }, [circuitJsonErrors])
}
