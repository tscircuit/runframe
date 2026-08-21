import { expect, test } from "bun:test"
import { SOLVERS, type SimpleRouteJson } from "@tscircuit/core"
import { getSolverConstructorArgs } from "lib/components/SolversTabContent/get-solver-constructor-args"

test("reconstructs an autorouter from Core's wrapped constructor args", () => {
  const input: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.15,
    obstacles: [],
    connections: [],
    bounds: { minX: -1, maxX: 1, minY: -1, maxY: 1 },
  }
  const solverParams = { input, options: { effort: 1 } }
  const constructorArgs = getSolverConstructorArgs({
    solverName: "AutoroutingPipelineSolver7_MultiGraph",
    solverParams,
    solverConstructorArgs: [solverParams],
  })
  const SolverClass = SOLVERS.AutoroutingPipelineSolver7_MultiGraph as new (
    ...args: any[]
  ) => unknown

  expect(() => new SolverClass(...constructorArgs)).not.toThrow()
})
