import { RunFrameForCli } from "lib/components/RunFrameForCli/RunFrameForCli"
import { RunFrameWithApi } from "lib/components/RunFrameWithApi/RunFrameWithApi"
import { useRunFrameStore } from "lib/components/RunFrameWithApi/store"
import { useState, useEffect } from "react"

export default () => {
  const recentEvents = useRunFrameStore((state) => state.recentEvents)
  const pushEvent = useRunFrameStore((state) => state.pushEvent)

  useEffect(() => {
    setTimeout(async () => {
      fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "main.tsx",
          text_content: `
import manualEdits from "./manual-edits.json"

console.log("inside render manualEdits", manualEdits)

circuit.add(
<board width="10mm" height="10mm" manualEdits={manualEdits}>
  <resistor name="R1" resistance="1k" footprint="0402" />
  <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={4} />
  <trace from=".R1 .pin1" to=".C1 .pin1" />
</board>
)`,
        }),
      })
      fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "manual-edits.json",
          text_content: JSON.stringify({}),
        }),
      })
    }, 500)
  }, [])

  if (
    typeof window !== "undefined" &&
    window.location.origin.includes("vercel.app")
  ) {
    return (
      <div>
        <h1>RunFrame with API</h1>
        <p>
          We don't currently deploy the API to vercel, try locally! The vite
          plugin will automatically load it.
        </p>
      </div>
    )
  }

  return (
    <>
      <RunFrameForCli debug />
      <div className="p-4">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Event Type</th>
              <th className="border border-gray-300 p-2">Created At</th>
              <th className="border border-gray-300 p-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {recentEvents
              .sort(
                (a, b) =>
                  new Date(b.created_at).valueOf() -
                  new Date(a.created_at).valueOf(),
              )
              .map(({ event_type, event_id, created_at, ...rest }) => (
                <tr key={event_id}>
                  <td className="border border-gray-300 p-2">{event_type}</td>
                  <td className="border border-gray-300 p-2">
                    {new Date(created_at).toLocaleString()}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {JSON.stringify(rest)
                      .slice(1, -1)
                      .replace(/"([^"]+)":/g, "$1:")}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
