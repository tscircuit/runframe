import { RunFrameWithApi } from "lib/components/RunFrameWithApi/RunFrameWithApi"
import { useState, useEffect } from "react"
import { isFileApiAccessible } from "./utils/isFileApiAccessible.ts"

export default () => {
  useEffect(() => {
    setTimeout(async () => {
      await fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "main.tsx",
          text_content: `
import manualEdits from "./manual-edits.json"

export default () => (
  <board width="10mm" height="10mm" manualEdits={manualEdits}>
    <resistor name="R1" resistance="1k" footprint="0402" />
    <capacitor name="C1" capacitance="1uF" footprint="0603" />
    <trace from=".R1 .pin1" to=".C1 .pin1" />
  </board>
)
`,
        }),
      })
      await fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "manual-edits.json",
          text_content: JSON.stringify({
            pcb_placements: [
              {
                selector: "R1",
                center: {
                  x: 5,
                  y: 5,
                },
                relative_to: "group_center",
              },
            ],
            edit_events: [],
            manual_trace_hints: [],
          }),
        }),
      })
      await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "INITIAL_FILES_UPLOADED",
          file_count: 2,
        }),
      })
    }, 500)
  }, [])

  if (!isFileApiAccessible()) {
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

  return <RunFrameWithApi debug autoRenderOnEdit={true} showRunButton={false} />
}
