import type { SolverEvent } from "../CircuitJsonPreview/PreviewContentProps"

type SolverEventId = string

export const getSolverIdsWithMatchpackLast = (
  solversById: ReadonlyMap<SolverEventId, SolverEvent>,
) => {
  const otherSolverIds: SolverEventId[] = []
  const matchpackSolverIds: SolverEventId[] = []

  for (const [solverId, solverEvent] of solversById) {
    if (solverEvent.solverName === "LayoutPipelineSolver") {
      matchpackSolverIds.push(solverId)
      continue
    }
    otherSolverIds.push(solverId)
  }

  return [...otherSolverIds, ...matchpackSolverIds]
}
