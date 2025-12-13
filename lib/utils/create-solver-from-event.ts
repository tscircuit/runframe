import { PackSolver2 } from "calculate-packing"
import {
  AssignableViaAutoroutingPipelineSolver,
  AutoroutingPipelineSolver,
} from "@tscircuit/capacity-autorouter"
import type { BaseSolver } from "@tscircuit/solver-utils"
import type { SolverStartedEvent } from "lib/types/solver-events"

const SOLVER_CLASSES = {
  PackSolver2,
  AutoroutingPipelineSolver,
  AssignableViaAutoroutingPipelineSolver,
} as const

type SupportedSolverName = keyof typeof SOLVER_CLASSES

const getSolverConstructor = (solverName: string) =>
  SOLVER_CLASSES[solverName as SupportedSolverName]

export const createSolverFromEvent = (
  event: SolverStartedEvent,
): { solver: BaseSolver | null; error: string | null } => {
  const SolverClass = getSolverConstructor(event.solverName)

  if (!SolverClass) {
    return {
      solver: null,
      error: `Solver "${event.solverName}" is not currently supported in this viewer`,
    }
  }

  try {
    const params = event.solverParams as any
    const SolverCtor = SolverClass as unknown as new (
      ...args: any[]
    ) => BaseSolver

    if (Array.isArray(params)) {
      return {
        solver: new SolverCtor(...params),
        error: null,
      }
    }

    if (params && typeof params === "object" && "input" in params) {
      return {
        solver: new SolverCtor((params as any).input, (params as any).options),
        error: null,
      }
    }

    if (params === undefined || params === null) {
      return { solver: new SolverCtor(params), error: null }
    }

    return { solver: new SolverCtor(params), error: null }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error constructing solver"

    return {
      solver: null,
      error: `Failed to construct solver: ${message}`,
    }
  }
}

export type { SupportedSolverName }
