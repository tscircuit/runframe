import { RunFrameStaticBuildViewer } from "lib/components/RunFrameStaticBuildViewer" 
import type { CircuitJson } from "circuit-json"

// Example circuit JSON data for demonstration
const exampleCircuit1: CircuitJson = [
  {
    type: "source_component",
    source_component_id: "R1",
    name: "R1",
    resistance: { value: 1000, unit: "ohm" },
    center: { x: 0, y: 0 },
  },
  {
    type: "source_component",
    source_component_id: "R2",
    name: "R2", 
    resistance: { value: 2000, unit: "ohm" },
    center: { x: 10, y: 0 },
  },
  {
    type: "net",
    net_id: "net1",
    name: "net1",
    connected_source_component_ids: ["R1", "R2"],
  },
]

const exampleCircuit2: CircuitJson = [
  {
    type: "source_component",
    source_component_id: "C1",
    name: "C1",
    capacitance: { value: 100, unit: "nF" },
    center: { x: 0, y: 0 },
  },
  {
    type: "source_component",
    source_component_id: "C2",
    name: "C2",
    capacitance: { value: 220, unit: "nF" },
    center: { x: 15, y: 0 },
  },
  {
    type: "net",
    net_id: "net2",
    name: "net2",
    connected_source_component_ids: ["C1", "C2"],
  },
]

const exampleCircuit3: CircuitJson = [
  {
    type: "source_component",
    source_component_id: "LED1",
    name: "LED1",
    led_color: "red",
    center: { x: 0, y: 0 },
  },
  {
    type: "source_component",
    source_component_id: "LED2",
    name: "LED2",
    led_color: "green", 
    center: { x: 20, y: 0 },
  },
  {
    type: "net",
    net_id: "net3",
    name: "net3",
    connected_source_component_ids: ["LED1", "LED2"],
  },
]

// Create a map of circuit JSON files
const circuitJsonFsMap = new Map<string, CircuitJson>([
  ["circuit.json", exampleCircuit1],
  ["capacitor_circuit.json", exampleCircuit2],
  ["led_circuit.json", exampleCircuit3],
])

export const ExampleRunFrameStaticBuildViewer = () => {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <RunFrameStaticBuildViewer
        circuitJsonFsMap={circuitJsonFsMap}
        defaultFilename="circuit.json"
        debug={false}
        defaultActiveTab="pcb"
        defaultToFullScreen={false}
        showToggleFullScreen={true}
        onCircuitJsonLoaded={(circuitJson, filename) => {
          console.log(`Circuit JSON loaded from ${filename}:`, circuitJson)
        }}
        onFileChange={(filename, circuitJson) => {
          console.log(`File changed to ${filename}:`, circuitJson)
        }}
      />
    </div>
  )
}
