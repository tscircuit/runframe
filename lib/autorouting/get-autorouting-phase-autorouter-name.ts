import type { AutoroutingPhase } from "./types"

const strategyLabels = new Map([
  ["custom", "Custom"],
  ["fanout", "Fanout"],
  ["single_layer_fanout", "Single layer fanout"],
  ["tscircuit_simplify", "Simplify"],
])

const genericStrategies = new Set([
  "tscircuit",
  "default",
  "auto",
  "auto_local",
])

function formatSolverName(solverName: string): string {
  if (solverName === "FanoutSolver") return "Fanout"
  if (solverName === "AutoroutingPipelineSolver11_Simplification") {
    return "Simplify"
  }
  const pipeline = solverName.match(
    /^AutoroutingPipeline(?:Solver)?(\d+)(?:_|$)/,
  )
  if (pipeline) return `Pipeline${pipeline[1]}`
  const assignable = solverName.match(/^AssignableAutoroutingPipeline(\d+)$/)
  if (assignable) return `Assignable${assignable[1]}`
  return solverName
}

/** Use emitted routing identity, never user-defined phase names or guessed defaults. */
export function getAutoroutingPhaseAutorouterName(
  phase: Pick<
    AutoroutingPhase,
    "autorouterName" | "autorouterVersion" | "solverName"
  >,
): string {
  const autorouterName = phase.autorouterName?.trim()
  const normalizedStrategy = autorouterName?.replace(/-/g, "_")
  const strategyLabel =
    normalizedStrategy && strategyLabels.get(normalizedStrategy)
  if (strategyLabel) return strategyLabel
  if (normalizedStrategy && !genericStrategies.has(normalizedStrategy)) {
    return autorouterName!
  }

  // The selected solver is stronger evidence than the requested version:
  // core can choose a different solver for simplification or assignable routing.
  const solverName = phase.solverName?.trim()
  if (solverName) return formatSolverName(solverName)

  const version = phase.autorouterVersion?.trim()
  if (version) {
    const pipeline = version.match(/^beta[_-]pipeline(\d+)$/)
    if (pipeline) return `Pipeline${pipeline[1]}`
    if (version === "latest") return "default"
    return version
  }
  return autorouterName ? "default" : "Unknown"
}
