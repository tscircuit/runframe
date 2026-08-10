import { useEffect, useRef } from "react"
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

  // Track errors already sent by content so a re-render with a new array
  // identity but the same errors does not re-send the whole list.
  const capturedErrorKeysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!circuitJsonErrors || circuitJsonErrors.length === 0) return
    for (const error of circuitJsonErrors) {
      const key = `${error.type}:${error.message ?? ""}`
      if (capturedErrorKeysRef.current.has(key)) continue
      capturedErrorKeysRef.current.add(key)

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
  }, [circuitJsonErrors])
}
