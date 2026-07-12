import { useEffect, useRef } from "react"
import { posthog } from "lib/utils"
import type { CircuitJsonError } from "circuit-json"

interface UseErrorTelemetryParams {
  errorMessage?: string | null | undefined
  errorStack?: string | null | undefined
  circuitJsonErrors?: CircuitJsonError[] | null | undefined
  /**
   * True when a render has completed (circuitJson is present and the runner is
   * idle) but produced no geometry any viewer can display. This is otherwise a
   * silent failure – no error is thrown, so nothing reaches error tracking and
   * the user is left staring at a blank canvas. Capturing it makes the blank
   * state measurable.
   */
  hasEmptyRenderResult?: boolean
  emptyRenderElementCount?: number
}

export const useErrorTelemetry = ({
  errorMessage,
  errorStack,
  circuitJsonErrors,
  hasEmptyRenderResult,
  emptyRenderElementCount,
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
          posthog.captureException(err, { error_type: error.type })
        } catch {
          // ignore analytics errors
        }
      }
    }
  }, [circuitJsonErrors])

  // Guard so we only report a given empty-render episode once, resetting when
  // the render recovers (so a later empty render is reported again).
  const reportedEmptyRenderRef = useRef(false)
  useEffect(() => {
    if (!hasEmptyRenderResult) {
      reportedEmptyRenderRef.current = false
      return
    }
    if (reportedEmptyRenderRef.current) return
    reportedEmptyRenderRef.current = true

    const err = new Error(
      "Render produced no displayable geometry (blank preview)",
    )
    err.name = "EmptyRenderResult"
    try {
      posthog.captureException(err, {
        error_type: "empty_render_result",
        circuit_json_element_count: emptyRenderElementCount,
      })
    } catch {
      // ignore analytics errors
    }
  }, [hasEmptyRenderResult, emptyRenderElementCount])
}
