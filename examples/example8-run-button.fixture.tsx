import { RunFrame } from "lib/components/RunFrame"
import React, { useState } from "react"

export default () => {
  const [code, setCode] = useState(
    `
// edit me
circuit.add(
<board width="10mm" height="10mm">
  <resistor name="R1" resistance="1k" footprint="0402" />
  <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={4} />
  <trace from=".R1 .pin1" to=".C1 .pin1" />
</board>
  )`.trim(),
  )

  return (
    <div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{
          width: "100%",
          margin: "1rem",
          border: "1px solid #ccc",
          padding: "1rem",
          fontFamily: "monospace",
          height: "200px",
          marginBottom: "1rem",
        }}
      />
      <RunFrame
        fsMap={{
          "main.tsx": code,
        }}
        entrypoint="main.tsx"
        showRunButton={true}
      />
    </div>
  )
}
