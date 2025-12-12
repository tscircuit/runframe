export interface SolverStartedEvent {
  type: "solver:started"
  solverName: string
  solverParams: unknown
  componentName: string
}
