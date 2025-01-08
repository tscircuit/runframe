import type { RenderLog } from "lib/render-logging/RenderLog"

export const RenderLogViewer = ({
  renderLog,
}: { renderLog?: RenderLog | null }) => {
  if (!renderLog)
    return (
      <div className="p-4 bg-gray-100 rounded-md">
        No render log, make sure this tab is open when you render (TODO add a
        rerender button here)
      </div>
    )

  const orderedPhaseTimings = Object.entries(
    renderLog?.phaseTimings ?? {},
  ).sort((a, b) => b[1] - a[1])

  return (
    <div>
      <div>Render Logs</div>
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left p-2">Phase</th>
            <th className="text-left p-2">Duration (ms)</th>
          </tr>
        </thead>
        <tbody>
          {orderedPhaseTimings.map(([phase, duration]) => (
            <tr key={phase}>
              <td className="p-2">{phase}</td>
              <td className="p-2">{duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
