import { RunFrameStaticBuildViewer } from "lib/components/RunFrameStaticBuildViewer/RunFrameStaticBuildViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

// Create some sample circuit JSON files
const sampleCircuitJsonFiles = {
  "resistor-circuit.json": renderToCircuitJson(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>
  ),
  "led-circuit.json": renderToCircuitJson(
    <board width="15mm" height="10mm">
      <led name="LED1" footprint="0603" pcbX={2} />
      <resistor name="R1" resistance="220" footprint="0402" pcbX={-2} />
      <trace from=".LED1 .anode" to=".R1 .pin1" />
    </board>
  ),
  "complex-circuit.json": renderToCircuitJson(
    <board width="20mm" height="15mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={3} />
      <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={0} pcbY={3} />
      <chip name="U1" footprint="soic8" pcbX={5} pcbY={0} />
      <trace from=".R1 .pin2" to=".C1 .pin1" />
      <trace from=".C1 .pin2" to=".U1 .pin1" />
    </board>
  ),
}

export default () => (
  <RunFrameStaticBuildViewer
    circuitJsonFiles={sampleCircuitJsonFiles}
    initialFile="resistor-circuit.json"
    projectName="Sample Project"
    scenarioSelectorContent={
      <div className="rf-text-xs rf-text-gray-600">
        Static Build Viewer Demo
      </div>
    }
  />
)
