import { CircuitJsonPreview } from "lib/components/CircuitJsonPreview/CircuitJsonPreview"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => (
  <CircuitJsonPreview
    defaultActiveTab="schematic"
    availableTabs={["schematic", "pcb"]}
    circuitJson={renderToCircuitJson(
      <board width="50mm" height="20mm">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0603"
          schX={-3}
          pcbX={-18}
        />
        <capacitor
          name="C1"
          capacitance="1uF"
          footprint="0805"
          schX={3}
          pcbX={18}
          layer="bottom"
        />
        <trace from=".R1 .pin2" to=".C1 .pin1" />
      </board>,
    )}
  />
)
