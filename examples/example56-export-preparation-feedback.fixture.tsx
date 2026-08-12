import { FileMenuLeftHeader } from "lib/components/FileMenuLeftHeader"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

const circuitJson = renderToCircuitJson(
  <board width="20mm" height="15mm">
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
    <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={3} />
    <trace from="R1.pin1" to="C1.pin1" />
    <trace from="R1.pin2" to="C1.pin2" />
  </board>,
)

export default () => (
  <FileMenuLeftHeader
    isWebEmbedded={false}
    circuitJson={circuitJson}
    projectName="export-feedback-example"
  />
)
