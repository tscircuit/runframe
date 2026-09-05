import type { SimpleRouteJson } from "@tscircuit/core"

/** Optional metadata emitted by newer core versions; older runs still work. */
export interface AutoroutingPhaseMetadata {
  subcircuit_id?: string | null
  componentDisplayName?: string
  phaseName?: string
  routingPhaseIndex?: number | null
  phaseOrdinal?: number
  phaseCount?: number
  phaseStageIndex?: number
  phaseStageCount?: number
  connectionCount?: number
  obstacleCount?: number
  previousTraceCount?: number
  isReroutePhase?: boolean
  autorouterName?: string
  autorouterVersion?: string
  solverName?: string
  effort?: number
  cacheStatus?: "disabled" | "hit" | "miss"
}

export interface AutoroutingPhaseEvent extends AutoroutingPhaseMetadata {
  type: "autorouting:start" | "autorouting:end" | "autorouting:error"
  simpleRouteJson?: SimpleRouteJson
  error?: { message: string; stack?: string }
}

export interface AutoroutingPhase extends AutoroutingPhaseMetadata {
  id: string
  status: "running" | "complete" | "error"
  startSimpleRouteJson?: SimpleRouteJson
  endSimpleRouteJson?: SimpleRouteJson
  errorSimpleRouteJson?: SimpleRouteJson
  error?: { message: string; stack?: string }
}

export type AutoroutingPhaseView = "input" | "output"
