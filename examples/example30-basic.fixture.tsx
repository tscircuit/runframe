import { RunFrameStaticBuildViewer } from "lib/components/RunFrameStaticBuildViewer"
import React from "react"
import type { CircuitJson } from "circuit-json"

const exampleCircuitJson: CircuitJson = [{
  type: "source_trace" as const,
  source_trace_id: "R1",
  connected_source_port_ids: ["pin0", "pin1"],
  connected_source_net_ids: [],
  subcircuit_id: "main",
  max_length: 10,
  min_trace_thickness: 0.1,
  display_name: "Resistor R1"
}, {
  type: "source_trace" as const,
  source_trace_id: "C1",
  connected_source_port_ids: ["pin0", "pin1"],
  connected_source_net_ids: [],
  subcircuit_id: "main",
  max_length: 10,
  min_trace_thickness: 0.1,
  display_name: "Capacitor C1"
}, {
  type: "source_trace" as const,
  source_trace_id: "connection1",
  connected_source_port_ids: ["R1.pin1", "C1.pin0"],
  connected_source_net_ids: ["net1"],
  subcircuit_id: "main",
  max_length: 10,
  min_trace_thickness: 0.1,
  display_name: "Connection"
}]

const circuitFiles: Record<string, CircuitJson> = {
  "basic-resistor-capacitor.json": exampleCircuitJson,
  "simple-circuit.json": [{
    type: "source_trace" as const,
    source_trace_id: "LED1",
    connected_source_port_ids: ["pin0", "pin1"],
    connected_source_net_ids: ["net1"],
    subcircuit_id: "main",
    max_length: 10,
    min_trace_thickness: 0.1,
    display_name: "LED"
  }]
}

export default () => (
  <div className="h-screen">
    <RunFrameStaticBuildViewer
      circuitJsonFiles={circuitFiles}
      defaultFilename="basic-resistor-capacitor.json"
      debug={false}
      onFileChange={(filename, circuitJson) => {
        console.log(`File changed to: ${filename}`, circuitJson)
      }}
      onCircuitJsonLoaded={(circuitJson, filename) => {
        console.log(`Circuit loaded: ${filename}`, circuitJson)
      }}
      onExport={(format, filename) => {
        console.log(`Exporting ${filename} as ${format}`)
      }}
    />
  </div>
)
