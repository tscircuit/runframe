import { useEffect } from "react"
import { posthog } from "lib/utils"
import type { CircuitJsonError } from "circuit-json"

interface UseErrorTelemetryParams {
  errorMessage?: string | null | undefined
  errorStack?: string | null | undefined
  circuitJsonErrors?: CircuitJsonError[] | null | undefined
}

/**
 * Minimal surface of the PostHog client used for error telemetry. Declared here so
 * the routing logic below can be unit-tested with a mock.
 */
export interface ErrorTelemetryClient {
  captureException: (error: Error, properties?: Record<string, unknown>) => void
  capture: (eventName: string, properties?: Record<string, unknown>) => void
}

/**
 * Circuit JSON errors (e.g. `pcb_component_outside_board_error`) are produced by
 * design-rule checks such as @tscircuit/checks. They describe user design mistakes
 * — "Component C1 extends outside board boundaries..." — and are surfaced to the
 * user in the UI. They are NOT JavaScript crashes, so re-wrapping them in `Error`
 * and sending them to `captureException` floods error tracking with noise that
 * buries genuine exceptions.
 *
 * Only errors explicitly flagged as fatal are treated as exceptions; everything
 * else is routed to a regular (non-exception) analytics event so the data is still
 * available without polluting error tracking.
 */
export const isFatalCircuitJsonError = (error: CircuitJsonError): boolean =>
  (error as { is_fatal?: boolean }).is_fatal === true

/**
 * Routes a single circuit JSON error to the appropriate telemetry channel:
 * fatal errors are reported as exceptions, design-rule findings as normal events.
 */
export const reportCircuitJsonError = (
  error: CircuitJsonError,
  client: ErrorTelemetryClient,
) => {
  try {
    if (isFatalCircuitJsonError(error)) {
      const err = new Error(error.message || "Circuit JSON Error")
      if ((error as any).stack) {
        ;(err as any).stack = (error as any).stack
      }
      client.captureException(err, { error_type: error.type })
    } else {
      // Design-rule / validation finding — track as a normal analytics event
      // instead of an exception so it doesn't pollute error tracking.
      client.capture("circuit_json_error", {
        error_type: error.type,
        error_message: error.message,
      })
    }
  } catch {
    // ignore analytics errors
  }
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
        reportCircuitJsonError(error, posthog)
      }
    }
  }, [circuitJsonErrors])
}
