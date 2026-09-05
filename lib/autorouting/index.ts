export type {
  AutoroutingPhase,
  AutoroutingPhaseEvent,
  AutoroutingPhaseMetadata,
  AutoroutingPhaseView,
} from "./types"
export { captureAutoroutingPhase } from "./capture-autorouting-phase"
export {
  AUTOROUTING_PHASE_HIGHLIGHT_COLOR,
  buildAutoroutingPhaseCircuitJson,
  getAutoroutingPhaseChangedTraceIds,
  getAutoroutingPhaseHighlightGraphics,
} from "./build-autorouting-phase-circuit-json"
