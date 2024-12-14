import { RunFrameWithApi } from "lib/components/RunFrameWithApi"
import { useState, useEffect } from "react"

export default () => {
  useEffect(() => {
    setTimeout(async () => {
      fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "main.tsx",
          text_content: `
circuit.add(
<board width="10mm" height="10mm">
  <resistor name="R1" resistance="1k" footprint="0402" />
  <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={4} />
  <trace from=".R1 .pin1" to=".C1 .pin1" />
</board>
)`,
        }),
      })
    }, 500)
  }, [])

  return <RunFrameWithApi />
}
