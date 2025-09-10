import { RunFrame } from "lib/components/RunFrame/RunFrame"
export default () => (
  <RunFrame
    fsMap={{
      "main.tsx": `
circuit.add(
  <board width="10mm" height="10mm">
    <resistor
      resistance="1k"
      footprint="kicad:Resistor_SMD/R_0402_1005Metric"
      name="R1"
    />
  </board>)
`,
    }}
    entrypoint="main.tsx"
    showRunButton
  />
)
