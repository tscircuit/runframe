import { CircuitJsonPreview } from "lib/components/CircuitJsonPreview/CircuitJsonPreview"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => (
  <CircuitJsonPreview
    circuitJson={renderToCircuitJson(
      <board width="10mm" height="10mm">
        <resistor name="R1" resistance="1k" footprint="0402" />
      </board>,
    )}
  />
)
