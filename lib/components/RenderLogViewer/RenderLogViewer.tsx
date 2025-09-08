import type { RenderLog } from "lib/render-logging/RenderLog"
import { orderedRenderPhases, type RenderPhase } from "@tscircuit/core"
import { useState } from "react"
import RenderTimingsBar, { getPhaseColor } from "./RenderTimingsBar"
import { Button } from "../ui/button"

export const RenderLogViewer = ({
  renderLog,
  onRerunWithDebug,
}: { 
  renderLog?: RenderLog | null
  onRerunWithDebug?: (debugOption: string) => void
}) => {
  const [sortOption, setSortOption] = useState<"longest" | "chronological">(
    "chronological",
  )
  const [selectedDebugOption, setSelectedDebugOption] = useState<string>("")

  const debugOptions = [
    { value: "", label: "None" },
    { value: "DEBUG=Group_doInitialSchematicTraceRender", label: "DEBUG=Group_doInitialSchematicTraceRender" },
    { value: "DEBUG=Group_doInitialSchematicLayoutMatchpack", label: "DEBUG=Group_doInitialSchematicLayoutMatchpack" },
    { value: "DEBUG=Group_doInitialPcbLayoutPack", label: "DEBUG=Group_doInitialPcbLayoutPack" },
  ]

  if (!renderLog)
    return (
      <div className="rf-p-4 rf-bg-gray-100 rf-rounded-md">
        <div className="rf-mb-4">
          No render log, make sure this tab is open when you render
        </div>
{onRerunWithDebug && (
          <div className="rf-flex rf-gap-2 rf-items-center">
            <select
              value={selectedDebugOption}
              onChange={(e) => setSelectedDebugOption(e.target.value)}
              className="rf-px-3 rf-py-1 rf-border rf-rounded rf-text-xs rf-bg-white"
            >
              {debugOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              onClick={() => onRerunWithDebug(selectedDebugOption)}
              size="sm"
              className="rf-text-xs"
            >
              Rerun Render with Debug
            </Button>
          </div>
        )}
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

  const totalTime = orderedPhaseTimings.reduce(
    (sum, [_, time]) => sum + time,
    0,
  )

  return (
    <div className="rf-bg-white">
      <div className="rf-flex rf-justify-between rf-items-center rf-mb-4">
        <div>Render Logs</div>
        <div className="rf-flex rf-gap-4 rf-items-center">
{onRerunWithDebug && (
            <div className="rf-flex rf-gap-2 rf-items-center">
              <select
                value={selectedDebugOption}
                onChange={(e) => setSelectedDebugOption(e.target.value)}
                className="rf-px-3 rf-py-1 rf-border rf-rounded rf-text-xs rf-bg-white"
              >
                {debugOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => onRerunWithDebug(selectedDebugOption)}
                size="sm"
                className="rf-text-xs"
              >
                Rerun Render with Debug
              </Button>
            </div>
          )}
          <div className="rf-flex rf-text-xs rf-items-center">
            <div className="rf-mr-2">Sort by:</div>
            <select
              value={sortOption}
              onChange={(e) =>
                setSortOption(e.target.value as "longest" | "chronological")
              }
              className="rf-px-2 rf-py-1 rf-border rf-rounded rf-text-xs"
            >
              <option value="chronological">Phase Order</option>
              <option value="longest">Duration</option>
            </select>
          </div>
        </div>
      </div>
      <RenderTimingsBar phaseTimings={renderLog.phaseTimings} />
      <table className="rf-w-full rf-text-xs">
        <thead>
          <tr>
            <th className="rf-text-left rf-p-2">Phase Order</th>
            <th className="rf-text-left rf-p-2">Phase</th>
            <th className="rf-text-left rf-p-2">Duration (ms)</th>
          </tr>
        </thead>
        <tbody>
          {orderedPhaseTimings.map(([phase, duration]) => (
            <tr key={phase}>
              <td className="rf-p-2">
                {orderedRenderPhases.indexOf(phase as RenderPhase)}
              </td>
              <td className="rf-p-2">{phase}</td>
              <td className="rf-p-2">
                <div className="rf-w-8">
                  <div
                    className="rf-h-2 rf-rounded-sm"
                    style={{
                      backgroundColor: getPhaseColor(phase),
                      width: `${(duration / totalTime) * 100}%`,
                    }}
                  />
                </div>
              </td>
              <td className="rf-p-2">
                <div className="rf-flex w-full">
                  <span className="rf-flex-grow">{duration}ms</span>
                  <span className="rf-text-gray-500 rf-pr-2">
                    {((duration / totalTime) * 100).toFixed(1)}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
