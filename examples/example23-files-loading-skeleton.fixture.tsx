import { RunFrame } from "lib/components/RunFrame/RunFrame"
export default () => {
  const fsMap = {
    "index.tsx": `
        // edit me
        circuit.add(
        <board width="10mm" height="10mm">
          <resistor name="R1" resistance="1k" footprint="0402" />
          <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={4} />
          <trace from=".R1 .pin1" to=".C1 .pin1" />
        </board>
        )`.trim(),
  }

  return <RunFrame fsMap={fsMap} entrypoint="index.tsx" isLoadingFiles={true} />
}
