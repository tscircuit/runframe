import type { SOLVERS } from "@tscircuit/core"
import type { SolverStartedEvent } from "../CircuitJsonPreview/PreviewContentProps"

type AutoroutingPipeline7ConstructorArgs = ConstructorParameters<
  (typeof SOLVERS)["AutoroutingPipelineSolver7_MultiGraph"]
>

type CoreAutoroutingPipeline7Params = {
  input: AutoroutingPipeline7ConstructorArgs[0]
  options: AutoroutingPipeline7ConstructorArgs[1]
}

const unwrapCoreAutoroutingPipeline7Params = (
  params: CoreAutoroutingPipeline7Params,
): AutoroutingPipeline7ConstructorArgs => [params.input, params.options]

export const getSolverConstructorArgs = (
  solverEvent: Pick<
    SolverStartedEvent,
    "solverName" | "solverParams" | "solverConstructorArgs"
  >,
): readonly unknown[] => {
  if (
    solverEvent.solverName === "AutoroutingPipelineSolver7_MultiGraph" &&
    solverEvent.solverConstructorArgs?.length === 1
  ) {
    return unwrapCoreAutoroutingPipeline7Params(
      solverEvent.solverConstructorArgs[0] as CoreAutoroutingPipeline7Params,
    )
  }

  if (solverEvent.solverConstructorArgs) {
    return solverEvent.solverConstructorArgs
  }

  if (solverEvent.solverName === "AutoroutingPipelineSolver7_MultiGraph") {
    return unwrapCoreAutoroutingPipeline7Params(
      solverEvent.solverParams as CoreAutoroutingPipeline7Params,
    )
  }

  return [solverEvent.solverParams]
}
