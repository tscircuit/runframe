import { RunFrame } from "lib/components/RunFrame/RunFrame"
import React from "react"

export default () => (
  <RunFrame
    fsMap={{
      "main.tsx": `
circuit.add(
<board width="10mm" height="10mm">
  <resistor name="R1" resistance="1k" footprint="0402" />
  <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={4} />
    <platedhole
        shape="circular_hole_with_rect_pad"
        holeDiameter={2}
        rectPadWidth={4}
        rectPadHeight={4}
        pcbX={-4}
        pcbY={0}
      />
  <trace from=".R1 .pin1" to=".C1 .pin1" />
</board>
)
`,
    }}
    defaultActiveTab="render_log"
    entrypoint="main.tsx"
    // showRenderLogTab
  />
)
