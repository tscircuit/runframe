import { RunFrameWithApi } from "lib/components/RunFrameWithApi/RunFrameWithApi"
import { useState, useEffect } from "react"
import {
  isLocalApiServerAvailable,
  getApiNotAvailableMessage,
} from "lib/utils/api-server-utils"

export default () => {
  useEffect(() => {
    setTimeout(async () => {
      await fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "main.tsx",
          text_content: `

export default () => (
  <board width="10mm" height="10mm">
    <resistor
      resistance="1k"
      footprint="0402"
      name="R1"
      pcbX={3}
    />
    <capacitor
      capacitance="1000pF"
      footprint="0402"
      name="C1"
      pcbX={-3}
    />
        <capacitor
      capacitance="1000pF"
      footprint="0402"
      name="C2"
      pcbX={-3}
    />
    <trace from=".R1 > .pin1" to=".C1 > .pin1" />
    <trace from=".R1 > .pin1" to=".C2 > .pin1" />

  </board>
)
`,
        }),
      })
    }, 500)
  }, [])

  if (!isLocalApiServerAvailable()) {
    return getApiNotAvailableMessage()
  }

  return <RunFrameWithApi debug />
}
