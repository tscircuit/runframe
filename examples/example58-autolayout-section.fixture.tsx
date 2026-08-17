import { RunFrame } from "lib/components/RunFrame/RunFrame"
import React from "react"

export default () => (
  <RunFrame
    fsMap={{
      "main.tsx": `
circuit.add(
  <board width="20mm" height="10mm" routingDisabled>
    <schematicsection name="power" displayName="Power" />
    <schematicsection name="control" displayName="Control" />

    <resistor
      name="R1"
      resistance="1k"
      footprint="0402"
      pcbX={-6}
      schSectionName="power"
    />
    <capacitor
      name="C1"
      capacitance="1uF"
      footprint="0402"
      pcbX={-2}
      schSectionName="power"
    />

    <resistor
      name="R2"
      resistance="10k"
      footprint="0402"
      pcbX={2}
      schSectionName="control"
    />
    <capacitor
      name="C2"
      capacitance="100nF"
      footprint="0402"
      pcbX={6}
      schSectionName="control"
    />
  </board>,
)
`,
    }}
    entrypoint="main.tsx"
    defaultActiveTab="solvers"
    showRunButton
  />
)
