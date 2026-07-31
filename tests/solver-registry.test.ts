import { describe, expect, test } from "bun:test"
import { LayoutPipelineSolver } from "@tscircuit/matchpack"
import {
  getRunframeSolverClass,
  RUNFRAME_SOLVERS,
} from "../lib/components/SolversTabContent/solver-registry"

describe("runframe solver registry", () => {
  test("includes Matchpack's LayoutPipelineSolver", () => {
    expect(getRunframeSolverClass("LayoutPipelineSolver")).toBe(
      LayoutPipelineSolver,
    )
    expect(RUNFRAME_SOLVERS.LayoutPipelineSolver).toBe(LayoutPipelineSolver)
  })

  test("retains solvers supplied by @tscircuit/core", () => {
    expect(getRunframeSolverClass("PackSolver2")).toBeFunction()
  })
})
