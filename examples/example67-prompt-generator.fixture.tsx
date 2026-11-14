import { RunFrame } from "../lib/components/RunFrame/RunFrame"
import sensor from "./assets/autorouting-sensor.json"

/** No demo AI responses: this fixture builds prompts for an external agent. */
export default () => (
  <div style={{ height: "100vh", padding: 16 }}>
    <RunFrame
      fsMap={{ "sensor.circuit.json": JSON.stringify(sensor.circuitJson) }}
      mainComponentPath="sensor.circuit.json"
      showFileMenu={false}
      showPromptGenerator
      defaultActiveTab="cad"
      availableTabs={["pcb", "schematic", "cad", "analog_simulation"]}
    />
  </div>
)
