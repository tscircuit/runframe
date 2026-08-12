import { useEffect, useRef } from "react"
import { posthog } from "lib/utils"
import { isCircuitJsonWarning } from "lib/utils/classify-circuit-json-elements"
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
  // A re-run of the same code produces a new circuit-json array with the same
  // errors, so keep a signature of every exception already sent and skip
  // duplicates. This stops one editor session from firing the same exception
  // on every render.
  const capturedSignatures = useRef<Set<string>>(new Set())

  const captureOnce = (
    signature: string,
    buildError: () => Error,
    properties?: Record<string, unknown>,
  ) => {
    if (capturedSignatures.current.has(signature)) return
    capturedSignatures.current.add(signature)
    try {
      posthog.captureException(buildError(), properties)
    } catch {
      // ignore analytics errors
    }
  }

  useEffect(() => {
    if (!errorMessage) return
    captureOnce(`message:${errorMessage}:${errorStack ?? ""}`, () => {
      const err = new Error(errorMessage)
      if (errorStack) err.stack = errorStack
      return err
    })
  }, [errorMessage, errorStack])

  useEffect(() => {
    if (!circuitJsonErrors?.length) return
    for (const error of circuitJsonErrors) {
      // A warning element can carry an error_type field, so never send it as an
      // exception even if it reaches this hook.
      if (isCircuitJsonWarning(error)) continue
      const stack = (error as any).stack as string | undefined
      captureOnce(
        `${error.type}:${error.message ?? ""}:${stack ?? ""}`,
        () => {
          const err = new Error(error.message || "Circuit JSON Error")
          if (stack) (err as any).stack = stack
          return err
        },
        { error_type: error.type },
      )
    }
  }, [circuitJsonErrors])
}
