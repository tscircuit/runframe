import { orderedRenderPhases, type RenderPhase } from "@tscircuit/core"
import React from "react"

export const getPhaseColor = (phase: string) => {
  const index = orderedRenderPhases.indexOf(phase as RenderPhase)
  const hue = (index * 137.5) % 360 // Golden angle approximation
  return `hsl(${hue}, 70%, 50%)`
}

export const RenderTimingsBar = ({
  phaseTimings,
}: { phaseTimings?: Record<string, number> }) => {
  if (!phaseTimings) return null

  const totalTime = Object.values(phaseTimings).reduce(
    (sum, time) => sum + time,
    0,
  )

  return (
    <div className="rf-space-y-2 rf-w-full rf-px-4">
      <div className="rf-relative rf-h-8 rf-flex rf-rounded-sm">
        {orderedRenderPhases.map((phase) => {
          const time = phaseTimings[phase] || 0
          const width = (time / totalTime) * 100

          return (
            <div
              key={phase}
              className="rf-group/bar rf-relative rf-overflow-visible"
              style={{
                width: `${width}%`,
                backgroundColor: getPhaseColor(phase),
              }}
            >
              <div className="rf-opacity-0 group-hover/bar:rf-opacity-100 rf-transition-opacity rf-absolute rf-bottom-full rf-left-1/2 rf-transform -rf-translate-x-1/2 rf-mb-2 rf-px-2 rf-py-1 rf-text-xs rf-whitespace-nowrap rf-rounded rf-bg-gray-900 rf-text-white rf-pointer-events-none">
                {phase}: {time.toFixed(1)}ms
              </div>
            </div>
          )
        })}
      </div>
      <div className="rf-text-xs rf-text-gray-500">
        Total: {totalTime.toFixed(2)}ms
      </div>
    </div>
  )
}

export default RenderTimingsBar
