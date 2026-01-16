import { RunFrame } from "lib/components/RunFrame/RunFrame"
import React from "react"

export default () => (
  <RunFrame
    fsMap={{
      "main.tsx": `
circuit.add(
<panel width="50mm" height="20mm">
  <board width="20mm" height="15mm">
    <resistor resistance="1k" footprint="0402" name="R1" />
  </board>
  <board width="20mm" height="15mm">
    <resistor resistance="1k" footprint="0402" name="R2" />
  </board>
</panel>
)
`,
    }}
    entrypoint="main.tsx"
  />
)
