export interface RenderLog {
  renderEvents?: any[]

  // Not sure if we can do this because of async
  phaseTimings?: Record<string, number>
}
