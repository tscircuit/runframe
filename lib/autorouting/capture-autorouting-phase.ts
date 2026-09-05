import type {
  AutoroutingPhase,
  AutoroutingPhaseEvent,
  AutoroutingPhaseMetadata,
} from "./types"

const metadataKeys = [
  "subcircuit_id",
  "componentDisplayName",
  "phaseName",
  "routingPhaseIndex",
  "phaseOrdinal",
  "phaseCount",
  "phaseStageIndex",
  "phaseStageCount",
  "connectionCount",
  "obstacleCount",
  "previousTraceCount",
  "isReroutePhase",
  "autorouterName",
  "autorouterVersion",
  "solverName",
  "effort",
  "cacheStatus",
] as const satisfies readonly (keyof AutoroutingPhaseMetadata)[]

const phaseIdentityKeys = [
  "phaseOrdinal",
  "routingPhaseIndex",
  "phaseName",
  "phaseStageIndex",
] as const

function getMatchingPhaseIndex(
  phases: readonly AutoroutingPhase[],
  event: AutoroutingPhaseEvent,
): number {
  let matchingIndex = -1
  let highestScore = -1
  for (let index = phases.length - 1; index >= 0; index--) {
    const phase = phases[index]
    if (
      phase.status !== "running" ||
      phase.subcircuit_id !== event.subcircuit_id ||
      phase.componentDisplayName !== event.componentDisplayName
    ) {
      continue
    }
    let score = 0
    let conflictingIdentity = false
    for (const key of phaseIdentityKeys) {
      if (phase[key] === undefined || event[key] === undefined) continue
      if (phase[key] !== event[key]) {
        conflictingIdentity = true
        break
      }
      score++
    }
    // Prefer explicit phase metadata over a legacy entry with missing metadata.
    // For legacy events, the most recent unfinished phase is the best match.
    if (!conflictingIdentity && score > highestScore) {
      matchingIndex = index
      highestScore = score
    }
  }
  return matchingIndex
}

/** Capture event-owned SRJ immediately, before its solver can mutate it. */
export function captureAutoroutingPhase(
  phases: readonly AutoroutingPhase[],
  event: AutoroutingPhaseEvent,
): AutoroutingPhase[] {
  const metadata = Object.fromEntries(
    metadataKeys
      .filter((key) => event[key] !== undefined)
      .map((key) => [key, event[key]]),
  ) as AutoroutingPhaseMetadata
  const simpleRouteJson = event.simpleRouteJson
    ? structuredClone(event.simpleRouteJson)
    : undefined
  const index =
    event.type === "autorouting:start"
      ? -1
      : getMatchingPhaseIndex(phases, event)
  const phase: AutoroutingPhase = {
    ...(index === -1
      ? { id: `autorouting_phase_${phases.length + 1}` }
      : phases[index]),
    ...metadata,
    status:
      event.type === "autorouting:start"
        ? "running"
        : event.type === "autorouting:end"
          ? "complete"
          : "error",
    ...(event.type === "autorouting:start"
      ? { startSimpleRouteJson: simpleRouteJson }
      : event.type === "autorouting:end"
        ? { endSimpleRouteJson: simpleRouteJson }
        : {
            errorSimpleRouteJson: simpleRouteJson,
            error: event.error ? { ...event.error } : undefined,
          }),
  }
  if (index === -1) return [...phases, phase]
  return phases.map((previousPhase, phaseIndex) =>
    phaseIndex === index ? phase : previousPhase,
  )
}
