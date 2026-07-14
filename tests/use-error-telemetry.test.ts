import { describe, expect, test } from "bun:test"
import type { CircuitJsonError } from "circuit-json"
import {
  isFatalCircuitJsonError,
  reportCircuitJsonError,
  type ErrorTelemetryClient,
} from "../lib/hooks/use-error-telemetry"

const makeError = (
  overrides: Partial<CircuitJsonError> = {},
): CircuitJsonError =>
  ({
    type: "pcb_component_outside_board_error",
    error_type: "pcb_component_outside_board_error",
    message:
      "Component C1 extends outside board boundaries by 0.23mm. Try moving it 0.23mm left.",
    ...overrides,
  }) as CircuitJsonError

const createMockClient = () => {
  const captureExceptionCalls: Array<{
    error: Error
    properties?: Record<string, unknown>
  }> = []
  const captureCalls: Array<{
    eventName: string
    properties?: Record<string, unknown>
  }> = []
  const client: ErrorTelemetryClient = {
    captureException: (error, properties) =>
      captureExceptionCalls.push({ error, properties }),
    capture: (eventName, properties) =>
      captureCalls.push({ eventName, properties }),
  }
  return { client, captureExceptionCalls, captureCalls }
}

describe("isFatalCircuitJsonError", () => {
  test("returns false for design-rule findings (is_fatal unset)", () => {
    expect(isFatalCircuitJsonError(makeError())).toBe(false)
  })

  test("returns false when is_fatal is explicitly false", () => {
    expect(isFatalCircuitJsonError(makeError({ is_fatal: false }))).toBe(false)
  })

  test("returns true only when is_fatal is explicitly true", () => {
    expect(isFatalCircuitJsonError(makeError({ is_fatal: true }))).toBe(true)
  })
})

describe("reportCircuitJsonError", () => {
  test("routes non-fatal design-rule errors to a normal analytics event, not captureException", () => {
    const { client, captureExceptionCalls, captureCalls } = createMockClient()

    reportCircuitJsonError(makeError(), client)

    expect(captureExceptionCalls).toHaveLength(0)
    expect(captureCalls).toHaveLength(1)
    expect(captureCalls[0].eventName).toBe("circuit_json_error")
    expect(captureCalls[0].properties?.error_type).toBe(
      "pcb_component_outside_board_error",
    )
  })

  test("routes fatal errors to captureException", () => {
    const { client, captureExceptionCalls, captureCalls } = createMockClient()

    reportCircuitJsonError(
      makeError({ type: "unknown_error", is_fatal: true, message: "boom" }),
      client,
    )

    expect(captureCalls).toHaveLength(0)
    expect(captureExceptionCalls).toHaveLength(1)
    expect(captureExceptionCalls[0].error).toBeInstanceOf(Error)
    expect(captureExceptionCalls[0].error.message).toBe("boom")
    expect(captureExceptionCalls[0].properties?.error_type).toBe(
      "unknown_error",
    )
  })
})
