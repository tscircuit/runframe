import type { SolverStartedEvent } from "../CircuitJsonPreview/PreviewContentProps"

export const getSolverConstructorArgs = (
  solverEvent: Pick<
    SolverStartedEvent,
    "solverName" | "solverParams" | "solverConstructorArgs"
  >,
): readonly unknown[] => {
  const constructorArgs = solverEvent.solverConstructorArgs ?? [
    solverEvent.solverParams,
  ]

  if (
    solverEvent.solverName !== "AutoroutingPipelineSolver7_MultiGraph" ||
    constructorArgs.length !== 1
  ) {
    return constructorArgs
  }

  const [{ input, options }] = constructorArgs as readonly [
    { input: unknown; options: unknown },
  ]
  return [input, options]
}
