import { orderedRenderPhases } from "@tscircuit/core"
import React from "react"

export const RenderTimingsBar = ({
  phaseTimings,
}: { phaseTimings?: Record<string, number> }) => {
  if (!phaseTimings) return null
  // Generate a color for each phase using HSL to ensure good distribution
  const getPhaseColor = (index: number) => {
    const hue = (index * 137.5) % 360 // Golden angle approximation
    return `hsl(${hue}, 70%, 50%)`
  }

  const totalTime = Object.values(phaseTimings).reduce(
    (sum, time) => sum + time,
    0,
  )

  return (
    <div className="rf-space-y-2 rf-w-full rf-px-4">
      <div className="rf-relative rf-h-8 rf-flex rf-rounded-sm">
        {orderedRenderPhases.map((phase, index) => {
          const time = phaseTimings[phase] || 0
          const width = (time / totalTime) * 100

          return (
            <div
              key={phase}
              className="rf-group rf-relative rf-overflow-visible"
              style={{
                width: `${width}%`,
                backgroundColor: getPhaseColor(index),
              }}
            >
              <div className="rf-opacity-0 rf-group-hover:opacity-100 rf-transition-opacity rf-absolute rf-bottom-full rf-left-1/2 rf-transform rf--translate-x-1/2 rf-mb-2 rf-px-2 rf-py-1 rf-text-xs rf-whitespace-nowrap rf-rounded rf-bg-gray-900 rf-text-white rf-pointer-events-none">
                {phase}: {time}ms
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
