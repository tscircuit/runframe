import type { CircuitJson } from "circuit-json"
import {
  captureAutoroutingPhase,
  type AutoroutingPhase,
  type AutoroutingPhaseEvent,
} from "lib/autorouting"
import { CircuitJsonPreview } from "lib/components/CircuitJsonPreview/CircuitJsonPreview"
import { RunFrame } from "lib/components/RunFrame/RunFrame"
import recording from "./assets/autorouting-sensor.json"
import sensorSource from "./assets/autorouting-sensor.tsx?raw"

// These are actual core events and circuit JSON, regenerated from sensorSource.
// Keeping the capture checked in makes this preview independent of worker/CDN
// availability and routing time. See assets/autorouting-sensor.README.md.
const circuitJson = recording.circuitJson as CircuitJson
const autoroutingPhases = recording.events.reduce<AutoroutingPhase[]>(
  (phases, event) =>
    captureAutoroutingPhase(phases, event as AutoroutingPhaseEvent),
  [],
)

const RecordedSensorBreakout = () => (
  <div style={{ height: "100vh" }}>
    <CircuitJsonPreview
      circuitJson={circuitJson}
      autoroutingPhases={autoroutingPhases}
      defaultTab="autorouting"
    />
  </div>
)

const LiveSensorBreakout = () => (
  <div style={{ height: "100vh" }}>
    <RunFrame
      fsMap={{
        "main.tsx": `${sensorSource}\ncircuit.add(<AutoroutingSensor />)`,
      }}
      entrypoint="main.tsx"
      defaultTab="autorouting"
      showRunButton
      platformConfig={{ placementDrcChecksDisabled: true }}
    />
  </div>
)

export default {
  "Recorded sensor breakout": RecordedSensorBreakout,
  "Live sensor breakout": LiveSensorBreakout,
}
