import { useEffect } from "react"
import { posthog } from "lib/utils"
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
        // Circuit-JSON / DRC errors are expected design feedback (e.g. "component
        // extends outside board boundaries", "no footprint specified",
        // unconnected nets) rather than application crashes. Capturing them via
        // captureException pollutes error tracking with dozens of expected
        // errors per session, burying real exceptions. Report them as a
        // distinct, non-exception `circuit_json_error` event instead so they
        // stay observable without being counted as $exceptions.
        try {
          posthog.capture("circuit_json_error", {
            error_type: error.type,
            message: error.message ?? null,
          })
        } catch {
          // ignore analytics errors
        }
      }
    }
  }, [circuitJsonErrors])
}
