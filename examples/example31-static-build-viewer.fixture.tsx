import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"
import { RunFrameStaticBuildViewer } from "../lib/components/RunFrameStaticBuildViewer/RunFrameStaticBuildViewer"
import type { CircuitJson } from "circuit-json"

const sampleCircuitJson1: CircuitJson = renderToCircuitJson(
  <board width="10mm" height="10mm">
    <resistor name="R1" schX={-1} resistance="1k" footprint="0402" />
    <resistor name="R2" schX={1} resistance="1k" footprint="0402" />
  </board>,
)

const sampleCircuitJson2: CircuitJson = renderToCircuitJson(
  <board width="10mm" height="10mm"></board>,
)
const sampleCircuitJson3: CircuitJson = renderToCircuitJson(
  <board width="10mm" height="10mm">
    <group name="wow">
      <resistor resistance="1k" footprint="0402" name="R1" />
      <capacitor capacitance="1000pF" footprint="0402" name="C1" />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" />
    </group>
  </board>,
)
const circuitJsonFiles = {
  "main.circuit.tsx": sampleCircuitJson1,
  "index.circuit.tsx": sampleCircuitJson3,
  "components/blank.circuit.tsx": sampleCircuitJson2,
  "examples/group.circuit.tsx": sampleCircuitJson3,
}

export const basic = () => (
  <RunFrameStaticBuildViewer
    circuitJsonFiles={circuitJsonFiles}
    projectName="test-project"
    defaultToFullScreen={false}
    showToggleFullScreen={true}
  />
)

export const emptyFiles = () => (
  <RunFrameStaticBuildViewer
    circuitJsonFiles={{}}
    projectName="empty-project"
  />
)

export const fullFledge = () => (
  <RunFrameStaticBuildViewer
    circuitJsonFiles={circuitJsonFiles}
    projectName="empty-project"
    debug={true}
    initialCircuitPath="d"
    onCircuitJsonPathChange={(c) => {
      console.info(c)
    }}
    defaultToFullScreen={false}
    showToggleFullScreen={true}
    showFileMenu={false}
  />
)

export default {
  basic,
  emptyFiles,
  fullFledge,
}
