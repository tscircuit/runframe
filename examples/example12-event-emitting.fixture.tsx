import { RunFrame } from "lib/components/RunFrame/RunFrame"
import React, { useState, useRef } from "react"

export default () => {
  // New state to collect onEditEvent events
  const [editEvents, setEditEvents] = useState<any[]>([])
  const lastEventTime = useRef<number>(0)

  const handleEditEvent = (event: any) => {
    const now = Date.now()
    lastEventTime.current = now
    console.log("onEditEvent", event)
    // If event is an array, add each item as its own event; otherwise, add single event.
    if (Array.isArray(event)) {
      setEditEvents((prev) => [
        ...prev,
        ...event.map((ev: any) => ({ time: new Date(), event: ev })),
      ])
    } else {
      setEditEvents((prev) => [...prev, { time: new Date(), event }])
    }
  }

  return (
    <div>
      <RunFrame
        fsMap={{
          "main.tsx": `
import { Fragment } from "react"

circuit.add(
  <board
    width="10mm"
    height="100mm"
    autorouter={{
      local: true,
      groupMode: "subcircuit",
    }}
  >
        <capacitor
          capacitance="1000pF"
          footprint="0402"
          name={"C1"}
          schX={-3}
          pcbX={-3}
          pcbY={0}
        />
        <resistor
          resistance="1k"
          footprint="0402"
          name={"R1"}
          schX={3}
          pcbX={3}
          pcbY={1}
        />
        <trace from={".R1 > .pin1"} to={".C1 > .pin1"} />
  </board>
)
`,
          "manual-edits.json": "{}",
        }}
        onReportAutoroutingLog={(name, data) => {
          window.alert("reporting...")
        }}
        onEditEvent={handleEditEvent}
        defaultActiveTab="pcb"
        entrypoint="main.tsx"
        showRunButton
        forceLatestEvalVersion
      />
      {/* Table to display onEditEvent events sorted by latest */}
      <div style={{ margin: "1rem" }}>
        <h2>Edit Events Log</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Time</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Event Details
              </th>
            </tr>
          </thead>
          <tbody>
            {[...editEvents].reverse().map(({ time, event }, index) => (
              <tr key={index}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {time.toLocaleTimeString()}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {JSON.stringify(event)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
