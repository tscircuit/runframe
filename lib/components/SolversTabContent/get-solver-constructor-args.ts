import type { SolverStartedEvent } from "../CircuitJsonPreview/PreviewContentProps"

export const getSolverConstructorArgs = (
  solverEvent: Pick<
    SolverStartedEvent,
    "solverParams" | "solverConstructorArgs"
  >,
): readonly unknown[] => {
  if (Array.isArray(solverEvent.solverConstructorArgs)) {
    return solverEvent.solverConstructorArgs
  }

  const solverParams = solverEvent.solverParams
  if (
    solverParams !== null &&
    typeof solverParams === "object" &&
    "input" in solverParams
  ) {
    return [(solverParams as { input: unknown }).input]
  }

  return [solverParams]
}
