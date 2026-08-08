import type {
  SolverEndedEvent,
  SolverEvent,
} from "../CircuitJsonPreview/PreviewContentProps"

export const applySolverEndedEvent = ({
  solverEvents,
  endedEvent,
}: {
  solverEvents: SolverEvent[]
  endedEvent: SolverEndedEvent
}) =>
  solverEvents.map((solverEvent) => {
    if (
      solverEvent.componentName !== endedEvent.componentName ||
      solverEvent.solverName !== endedEvent.solverName
    ) {
      return solverEvent
    }
    return { ...solverEvent, endedEvent }
  })
