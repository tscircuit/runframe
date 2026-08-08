import { expect, test } from "bun:test"
import { LayoutPipelineSolver } from "@tscircuit/matchpack"
import type { SolverStartedEvent } from "../lib/components/CircuitJsonPreview/PreviewContentProps"
import { getSolverIdsWithMatchpackLast } from "../lib/components/SolversTabContent/get-solver-ids-with-matchpack-last"
import {
  getRunframeSolverClass,
  RUNFRAME_SOLVERS,
} from "../lib/components/SolversTabContent/solver-registry"

const createSolverEvent = (solverName: string): SolverStartedEvent => ({
  type: "solver:started",
  solverName,
  solverParams: {},
  componentName: "board",
})

test("registers Matchpack and places it after other solvers", () => {
  expect(getRunframeSolverClass("LayoutPipelineSolver")).toBe(
    LayoutPipelineSolver,
  )
  expect(RUNFRAME_SOLVERS.LayoutPipelineSolver).toBe(LayoutPipelineSolver)

  const solverIds = getSolverIdsWithMatchpackLast(
    new Map([
      ["autorouter", createSolverEvent("AutoroutingPipelineSolver")],
      ["matchpack", createSolverEvent("LayoutPipelineSolver")],
      ["packing", createSolverEvent("PackSolver2")],
    ]),
  )

  expect(solverIds).toEqual(["autorouter", "packing", "matchpack"])
})
