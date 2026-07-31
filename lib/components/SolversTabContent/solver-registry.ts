import { SOLVERS } from "@tscircuit/core"
import { LayoutPipelineSolver } from "@tscircuit/matchpack"

export const RUNFRAME_SOLVERS = {
  ...SOLVERS,
  LayoutPipelineSolver,
}

type SolverConstructor = new (solverInput: never) => object

export const getRunframeSolverClass = (solverName: string) =>
  (RUNFRAME_SOLVERS as Record<string, SolverConstructor>)[solverName]
