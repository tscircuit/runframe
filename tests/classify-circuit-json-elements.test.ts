import { describe, expect, test } from "bun:test"

import {
  isCircuitJsonError,
  isCircuitJsonWarning,
} from "../lib/utils/classify-circuit-json-elements"

// The reported bug: this warning carries an error_type field equal to its own
// type, so a bare "error_type" in element check sent it to error tracking.
const sourcePropertyIgnoredWarning = {
  type: "source_property_ignored_warning",
  source_property_ignored_warning_id: "spiw_1",
  source_component_id: "sc_1",
  property_name: "schSheetName",
  error_type: "source_property_ignored_warning",
  message: 'Component "power" set schSheetName "Sheet A" but no such sheet',
}

const schematicError = {
  type: "schematic_error",
  schematic_error_id: "se_1",
  error_type: "schematic_error",
  message: "Something went wrong",
}

describe("isCircuitJsonWarning", () => {
  test("treats a warning that carries error_type as a warning", () => {
    expect(isCircuitJsonWarning(sourcePropertyIgnoredWarning)).toBe(true)
  })

  test("matches elements with a warning_type field", () => {
    expect(isCircuitJsonWarning({ type: "x", warning_type: "y" })).toBe(true)
  })

  test("does not treat a real error as a warning", () => {
    expect(isCircuitJsonWarning(schematicError)).toBe(false)
  })
})

describe("isCircuitJsonError", () => {
  test("keeps a warning that carries error_type out of the error bucket", () => {
    expect(isCircuitJsonError(sourcePropertyIgnoredWarning)).toBe(false)
  })

  test("still classifies a real error", () => {
    expect(isCircuitJsonError(schematicError)).toBe(true)
  })

  test("classifies an error whose type only contains 'error'", () => {
    expect(isCircuitJsonError({ type: "unknown_error_finding_part" })).toBe(
      true,
    )
  })

  test("ignores a plain element", () => {
    expect(isCircuitJsonError({ type: "source_component" })).toBe(false)
  })
})
