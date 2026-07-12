import { describe, expect, test } from "bun:test"

import { getRenderableGeometrySummary } from "../lib/utils/get-renderable-geometry-summary"

describe("getRenderableGeometrySummary", () => {
  test("returns null when there is no circuit json yet", () => {
    expect(getRenderableGeometrySummary(null)).toBeNull()
    expect(getRenderableGeometrySummary(undefined)).toBeNull()
  })

  test("flags a render that produced no displayable geometry", () => {
    // Eval ran without a fatal error but only produced source elements - this
    // is the silent blank-canvas case the preview must not hide.
    const summary = getRenderableGeometrySummary([
      { type: "source_component", name: "R1" },
      { type: "source_port" },
    ])
    expect(summary).toEqual({
      hasPcb: false,
      hasSchematic: false,
      hasCad: false,
      hasSimulation: false,
      hasAny: false,
    })
  })

  test("an empty circuit json array has no geometry", () => {
    const summary = getRenderableGeometrySummary([])
    expect(summary?.hasAny).toBe(false)
  })

  test("detects pcb geometry", () => {
    const summary = getRenderableGeometrySummary([
      { type: "source_component" },
      { type: "pcb_board" },
    ])
    expect(summary?.hasPcb).toBe(true)
    expect(summary?.hasAny).toBe(true)
  })

  test("detects schematic-only geometry (no pcb)", () => {
    const summary = getRenderableGeometrySummary([
      { type: "schematic_component" },
      { type: "schematic_group" },
    ])
    expect(summary?.hasSchematic).toBe(true)
    expect(summary?.hasPcb).toBe(false)
    expect(summary?.hasAny).toBe(true)
  })

  test("detects 3d/cad geometry", () => {
    const summary = getRenderableGeometrySummary([{ type: "cad_component" }])
    expect(summary?.hasCad).toBe(true)
    expect(summary?.hasAny).toBe(true)
  })

  test("detects simulation geometry", () => {
    const summary = getRenderableGeometrySummary([
      { type: "simulation_transient_voltage_graph" },
    ])
    expect(summary?.hasSimulation).toBe(true)
    expect(summary?.hasAny).toBe(true)
  })

  test("ignores malformed elements without a string type", () => {
    const summary = getRenderableGeometrySummary([
      null as any,
      {} as any,
      { type: 42 } as any,
      { type: "pcb_smtpad" },
    ])
    expect(summary?.hasPcb).toBe(true)
  })
})
