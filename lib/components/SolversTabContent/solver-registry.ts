import { SOLVERS } from "@tscircuit/core"
import { LayoutPipelineSolver } from "@tscircuit/matchpack"
import type { SolverStartedEvent } from "../CircuitJsonPreview/PreviewContentProps"

type SolverConstructor = new (...constructorArguments: never[]) => object
type SolverRegistry = Record<string, SolverConstructor>

export const RUNFRAME_SOLVERS: SolverRegistry = {
  ...SOLVERS,
  LayoutPipelineSolver,
}

export const instantiateSolverFromEvent = ({
  solverEvent,
  solverRegistry = RUNFRAME_SOLVERS,
}: {
  solverEvent: SolverStartedEvent
  solverRegistry?: SolverRegistry
}) => {
  const SolverClass = solverRegistry[solverEvent.solverName]
  if (!SolverClass) return null

  if (solverEvent.solverConstructorArgs !== undefined) {
    return new SolverClass(...(solverEvent.solverConstructorArgs as never[]))
  }

  const legacySolverInput = solverEvent.solverParams as Record<string, unknown>
  if (legacySolverInput.input !== undefined) {
    return new SolverClass(legacySolverInput.input as never)
  }

  return new SolverClass(legacySolverInput as never)
}
