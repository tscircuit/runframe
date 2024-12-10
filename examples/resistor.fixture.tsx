import { CircuitJsonPreview } from "lib/components/CircuitJsonPreview"
// import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => (
  <CircuitJsonPreview
    circuitJson={[]}
    // circuitJson={renderToCircuitJson(
    //   <board width="10mm" height="10mm">
    //     <resistor name="R1" resistance="1k" footprint="0402" />
    //   </board>,
    // )}
  />
)
