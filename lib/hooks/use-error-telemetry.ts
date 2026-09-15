import { useEffect } from "react"
import { posthog } from "lib/utils"
import type { CircuitJsonError } from "circuit-json"

interface UseErrorTelemetryParams {
  errorMessage?: string | null | undefined
  errorStack?: string | null | undefined
  circuitJsonErrors?: CircuitJsonError[] | null | undefined
}

// Circuit JSON errors are design-rule check results (unconnected ports,
// courtyard overlaps, pad clearance violations), not code faults. Count them by
// type so a re-evaluation reports one analytics event instead of one exception
// per element, which kept re-opening error-tracking issues on every keystroke.
export const countCircuitJsonErrorsByType = (
  circuitJsonErrors: CircuitJsonError[] | null | undefined,
): Record<string, number> => {
  const counts: Record<string, number> = {}
  for (const error of circuitJsonErrors ?? []) {
    const type = error.type ?? "unknown"
    counts[type] = (counts[type] ?? 0) + 1
  }
  return counts
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
    if (!circuitJsonErrors || circuitJsonErrors.length === 0) return
    try {
      posthog.capture("circuit_json_design_check_errors", {
        error_count: circuitJsonErrors.length,
        error_counts_by_type: countCircuitJsonErrorsByType(circuitJsonErrors),
      })
    } catch {
      // ignore analytics errors
    }
  }, [circuitJsonErrors])
}
