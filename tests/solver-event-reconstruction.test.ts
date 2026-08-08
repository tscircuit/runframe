import { describe, expect, test } from "bun:test"
import { LayoutPipelineSolver } from "@tscircuit/matchpack"
import { applySolverEndedEvent } from "../lib/components/SolversTabContent/apply-solver-ended-event"
import { getSolverIdsWithMatchpackLast } from "../lib/components/SolversTabContent/get-solver-ids-with-matchpack-last"
import {
  instantiateSolverFromEvent,
  RUNFRAME_SOLVERS,
} from "../lib/components/SolversTabContent/solver-registry"

class TwoArgumentSolver {
  constructor(
    public inputCount: number,
    public mode: string,
  ) {}
}

class LegacySolver {
  constructor(public solverInput: object) {}
}

describe("solver event reconstruction", () => {
  test("passes every emitted constructor argument in order", () => {
    const solver = instantiateSolverFromEvent({
      solverEvent: {
        type: "solver:started",
        solverName: "TwoArgumentSolver",
        solverParams: { inputCount: 99 },
        solverConstructorArgs: [7, "exact"],
        componentName: "board",
      },
      solverRegistry: { TwoArgumentSolver },
    })

    expect(solver).toBeInstanceOf(TwoArgumentSolver)
    expect(solver).toMatchObject({ inputCount: 7, mode: "exact" })
  })

  test("supports legacy events without constructor arguments", () => {
    const solverInput = { componentCount: 3 }
    const solver = instantiateSolverFromEvent({
      solverEvent: {
        type: "solver:started",
        solverName: "LegacySolver",
        solverParams: { input: solverInput },
        componentName: "board",
      },
      solverRegistry: { LegacySolver },
    })

    expect(solver).toMatchObject({ solverInput })
  })

  test("registers Matchpack's LayoutPipelineSolver", () => {
    expect(RUNFRAME_SOLVERS.LayoutPipelineSolver).toBe(LayoutPipelineSolver)
  })

  test("records completion state on the matching solver", () => {
    const solverEvents = applySolverEndedEvent({
      solverEvents: [
        {
          type: "solver:started",
          solverName: "LayoutPipelineSolver",
          solverParams: {},
          componentName: "board",
        },
      ],
      endedEvent: {
        type: "solver:ended",
        solverName: "LayoutPipelineSolver",
        componentName: "board",
        solved: true,
        failed: false,
        iterations: 12,
        error: null,
      },
    })

    expect(solverEvents).toHaveLength(1)
    expect(solverEvents[0].endedEvent).toMatchObject({
      solved: true,
      failed: false,
      iterations: 12,
      error: null,
    })
  })

  test("places Matchpack after the other detected solvers", () => {
    const solverIds = getSolverIdsWithMatchpackLast(
      new Map([
        [
          "autorouter",
          {
            type: "solver:started" as const,
            solverName: "AutoroutingPipelineSolver",
            solverParams: {},
            componentName: "board",
          },
        ],
        [
          "matchpack",
          {
            type: "solver:started" as const,
            solverName: "LayoutPipelineSolver",
            solverParams: {},
            componentName: "board",
          },
        ],
        [
          "packing",
          {
            type: "solver:started" as const,
            solverName: "PackSolver2",
            solverParams: {},
            componentName: "board",
          },
        ],
      ]),
    )

    expect(solverIds).toEqual(["autorouter", "packing", "matchpack"])
  })
})
