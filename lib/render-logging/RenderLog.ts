export type RenderEvent = {
  type:
    | `renderable:renderLifecycle:${string}:start`
    | `renderable:renderLifecycle:${string}:end`
    | `board:renderPhaseStarted`
  /**
   * Corresponds to the element that was rendered
   */
  renderId: string
  eventsProcessed: number
  createdAt: number
  phase?: string
}

export interface RenderLog {
  lastRenderEvent?: RenderEvent
  eventsProcessed?: number
  progress?: number

  renderEvents?: RenderEvent[]

  // Not sure if we can do this because of async
  phaseTimings?: Record<string, number>
}
