import { describe, expect, test } from "bun:test"
import { getCircuitJsonErrorFingerprint } from "../lib/utils/get-circuit-json-error-fingerprint"

describe("getCircuitJsonErrorFingerprint", () => {
  test("groups errors of the same type regardless of per-trace message", () => {
    // Two distinct traces produce two distinct messages upstream, but they are
    // the same class of DRC error and must collapse to one fingerprint.
    const a = getCircuitJsonErrorFingerprint({ type: "pcb_trace_error" })
    const b = getCircuitJsonErrorFingerprint({ type: "pcb_trace_error" })

    expect(a).toBe(b)
    expect(a).toBe("circuit-json-error:pcb_trace_error")
  })

  test("different error types map to different fingerprints", () => {
    expect(
      getCircuitJsonErrorFingerprint({ type: "pcb_trace_error" }),
    ).not.toBe(getCircuitJsonErrorFingerprint({ type: "pcb_placement_error" }))
  })

  test("falls back to a stable value when type is missing", () => {
    expect(getCircuitJsonErrorFingerprint({})).toBe(
      "circuit-json-error:unknown",
    )
    expect(getCircuitJsonErrorFingerprint({ type: "" })).toBe(
      "circuit-json-error:unknown",
    )
    expect(getCircuitJsonErrorFingerprint({ type: null })).toBe(
      "circuit-json-error:unknown",
    )
  })
})
