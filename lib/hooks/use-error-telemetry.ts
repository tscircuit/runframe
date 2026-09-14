import { useEffect } from "react"
import { posthog } from "lib/utils"
import type { CircuitJsonError } from "circuit-json"

interface UseErrorTelemetryParams {
  errorMessage?: string | null | undefined
  errorStack?: string | null | undefined
  circuitJsonErrors?: CircuitJsonError[] | null | undefined
}

// The preview error state drops the original constructor name, keeping only the
// message and stack. Recover the type from the stack so this handled capture
// fingerprints like the browser's autocapture of the same throw, instead of
// opening a second issue typed as a generic Error.
export const getErrorNameFromStack = (
  stack: string | null | undefined,
): string | null => {
  const firstLine = stack?.split("\n", 1)[0]?.trim() ?? ""
  const match = firstLine.match(/^([A-Za-z][A-Za-z0-9_]*Error):/)
  return match ? match[1] : null
}

export const useErrorTelemetry = ({
  errorMessage,
  errorStack,
  circuitJsonErrors,
}: UseErrorTelemetryParams) => {
  useEffect(() => {
    if (errorMessage) {
      const err = new Error(errorMessage)
      if (errorStack) {
        err.stack = errorStack
        const errorName = getErrorNameFromStack(errorStack)
        if (errorName) err.name = errorName
      }
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
          posthog.captureException(err, { error_type: error.type })
        } catch {
          // ignore analytics errors
        }
      }
    }
  }, [circuitJsonErrors])
}
