import type { SolverStartedEvent } from "../CircuitJsonPreview/PreviewContentProps"

export const getSolverConstructorArgs = (
  solverEvent: Pick<
    SolverStartedEvent,
    "solverParams" | "solverConstructorArgs"
  >,
): readonly unknown[] => {
  if (Array.isArray(solverEvent.solverConstructorArgs)) {
    const [onlyConstructorArg] = solverEvent.solverConstructorArgs
    if (
      solverEvent.solverConstructorArgs.length === 1 &&
      onlyConstructorArg !== null &&
      typeof onlyConstructorArg === "object" &&
      "input" in onlyConstructorArg &&
      "options" in onlyConstructorArg
    ) {
      return [onlyConstructorArg.input, onlyConstructorArg.options]
    }

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
