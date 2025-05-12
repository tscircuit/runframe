import { RunFrame } from "lib/components/RunFrame/RunFrame"
import React from "react"

export default () => (
  <RunFrame
    fsMap={{
      "main.tsx": `
circuit.add(
<board width="15mm" height="15mm" schAutoLayoutEnabled>
  <chip name="U1" footprint="tssop20" />
  <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} pcbY={-6}/>
  <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={6} pcbY={6} />
  <trace from=".R1 .pin1" to=".C1 .pin1" />
  <trace from=".R1 .pin2" to=".U1 .pin20" />
  <trace from=".C1 .pin1" to=".U1 .pin3" />
  <trace from=".C1 .pin2" to=".U1 .pin13" />
  <trace from=".R1 .pin1" to=".U1 .pin11" />
</board>
)
`,
    }}
    entrypoint="main.tsx"
    showRunButton
  />
)
