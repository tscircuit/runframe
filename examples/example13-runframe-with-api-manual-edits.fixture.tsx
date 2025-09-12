import { RunFrameWithApi } from "lib/components/RunFrameWithApi/RunFrameWithApi"
import { useState, useEffect } from "react"
import {
  isLocalApiServerAvailable,
  getApiNotAvailableMessage,
} from "lib/utils/api-server-utils"

export default () => {
  useEffect(() => {
    setTimeout(async () => {
      fetch("/api/files/upsert", {
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
      fetch("/api/files/upsert", {
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
    }, 500)
  }, [])

  if (!isLocalApiServerAvailable()) {
    return getApiNotAvailableMessage()
  }

  return <RunFrameWithApi debug />
}
