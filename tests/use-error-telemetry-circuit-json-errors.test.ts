import { describe, expect, test } from "bun:test"
import type { CircuitJsonError } from "circuit-json"
import { countCircuitJsonErrorsByType } from "../lib/hooks/use-error-telemetry"

const makeError = (type: string): CircuitJsonError =>
  ({ type, message: `${type} message` }) as unknown as CircuitJsonError

describe("countCircuitJsonErrorsByType", () => {
  test("counts errors grouped by type", () => {
    expect(
      countCircuitJsonErrorsByType([
        makeError("pcb_trace_error"),
        makeError("pcb_trace_error"),
        makeError("pcb_footprint_overlap_error"),
      ]),
    ).toEqual({
      pcb_trace_error: 2,
      pcb_footprint_overlap_error: 1,
    })
  })

  test("returns an empty object when there are no errors", () => {
    expect(countCircuitJsonErrorsByType([])).toEqual({})
    expect(countCircuitJsonErrorsByType(null)).toEqual({})
    expect(countCircuitJsonErrorsByType(undefined)).toEqual({})
  })
})
