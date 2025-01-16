import type { RenderLog } from "lib/render-logging/RenderLog"
import { orderedRenderPhases, type RenderPhase } from "@tscircuit/core"
import { useState } from "react"
import RenderTimingsBar from "./RenderTimingsBar"

export const RenderLogViewer = ({
  renderLog,
}: { renderLog?: RenderLog | null }) => {
  const [sortOption, setSortOption] = useState<"longest" | "chronological">(
    "chronological",
  )
  if (!renderLog)
    return (
      <div className="p-4 bg-gray-100 rounded-md">
        No render log, make sure this tab is open when you render (TODO add a
        rerender button here)
      </div>
    )

  const orderedPhaseTimings = Object.entries(renderLog?.phaseTimings ?? {})

  if (sortOption === "chronological") {
    orderedPhaseTimings.sort(
      (a, b) =>
        orderedRenderPhases.indexOf(a[0] as RenderPhase) -
        orderedRenderPhases.indexOf(b[0] as RenderPhase),
    )
  } else {
    orderedPhaseTimings.sort((a, b) => b[1] - a[1])
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>Render Logs</div>
        <div className="mb-4 pr-2 flex text-xs items-center">
          <div className="mr-2">Sort by:</div>
          <select
            value={sortOption}
            onChange={(e) =>
              setSortOption(e.target.value as "longest" | "chronological")
            }
            className="px-2 py-1 border rounded text-xs"
          >
            <option value="chronological">Phase Order</option>
            <option value="longest">Duration</option>
          </select>
        </div>
      </div>
      <RenderTimingsBar phaseTimings={renderLog.phaseTimings} />
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left p-2">Phase Order</th>
            <th className="text-left p-2">Phase</th>
            <th className="text-left p-2">Duration (ms)</th>
          </tr>
        </thead>
        <tbody>
          {orderedPhaseTimings.map(([phase, duration]) => (
            <tr key={phase}>
              <td className="p-2">
                {orderedRenderPhases.indexOf(phase as RenderPhase)}
              </td>
              <td className="p-2">{phase}</td>
              <td className="p-2">{duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
