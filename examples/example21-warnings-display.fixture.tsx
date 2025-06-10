import { RunFrame } from "lib/runner"

export default () => {
  return (
    <RunFrame
      fsMap={{
        "index.tsx": `
      const manualEdits = {
        pcb_placements: [
          {
            selector: "C1",
            center: {
              x: -1.451612903225806,
              y: 2.623655913978494,
            },
            relative_to: "group_center",
          },
        ],
      }

      export default () => (
        <board width="10mm" height="10mm" manualEdits={manualEdits}>
          <resistor resistance="1k" footprint="0402" name="R1" schX={3} pcbX={3} />
          <capacitor
            capacitance="1000pF"
            footprint="0402"
            name="C1"
            schX={-3}
            pcbX={-3}
          />
          <trace from=".R1 > .pin1" to=".C1 > .pin1" />
        </board>
      )
      `,
      }}
    />
  )
}
