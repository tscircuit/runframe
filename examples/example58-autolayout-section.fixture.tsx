import { RunFrame } from "lib/components/RunFrame/RunFrame"
import React from "react"

export default () => (
  <RunFrame
    fsMap={{
      "main.tsx": `
circuit.add(
  <board width="20mm" height="10mm" routingDisabled>
    <schematicsection name="decoupling" displayName="Decoupling" />
    <schematicsection name="indicator" displayName="Status Indicator" />

    <capacitor
      name="C1"
      capacitance="1uF"
      footprint="0402"
      pcbX={-6}
      schSectionName="decoupling"
    />
    <capacitor
      name="C2"
      capacitance="100nF"
      footprint="0402"
      pcbX={-2}
      schSectionName="decoupling"
    />

    <resistor
      name="R1"
      resistance="1k"
      footprint="0402"
      pcbX={2}
      schSectionName="indicator"
    />
    <led
      name="D1"
      color="green"
      footprint="0603"
      pcbX={6}
      schSectionName="indicator"
    />

    <trace from={"net.VCC"} to={".C1 > .pin1"} />
    <trace from={".C1 > .pin2"} to={"net.GND"} />
    <trace from={"net.VCC"} to={".C2 > .pin1"} />
    <trace from={".C2 > .pin2"} to={"net.GND"} />

    <trace from={"net.VCC"} to={".R1 > .pin1"} />
    <trace from={".R1 > .pin2"} to={".D1 > .pin1"} />
    <trace from={".D1 > .pin2"} to={"net.GND"} />
  </board>,
)
`,
    }}
    entrypoint="main.tsx"
    defaultActiveTab="solvers"
    showRunButton
  />
)
