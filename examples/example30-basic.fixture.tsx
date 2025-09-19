import { RunFrameStaticBuildViewer } from "lib/components/RunFrameStaticBuildViewer"
import React from "react"

// Example circuit JSON data for static loading
const exampleCircuitJson = {
  lb: {
    R1: {
      type: "resistor",
      resistance: "1k",
      name: "R1",
      pcb_x: 0,
      pcb_y: 0,
      pin0: { x: 0, y: 0 },
      pin1: { x: 2.54, y: 0 },
    },
    C1: {
      type: "capacitor",
      capacitance: "1uF",
      name: "C1",
      pcb_x: 5,
      pcb_y: 0,
      pin0: { x: 5, y: 0 },
      pin1: { x: 7.54, y: 0 },
    },
  },
  circuit_connections: [
    {
      from: { component: "R1", port: "pin1" },
      to: { component: "C1", port: "pin0" },
    },
  ],
  pcb_components: [
    {
      name: "R1",
      pcb_x: 0,
      pcb_y: 0,
      rotation: 0,
      footprint: "0402",
    },
    {
      name: "C1",
      pcb_x: 5,
      pcb_y: 0,
      rotation: 0,
      footprint: "0603",
    },
  ],
  pcb_traces: [
    {
      from: { component: "R1", port: "pin1" },
      to: { component: "C1", port: "pin0" },
      route: [
        { x: 2.54, y: 0 },
        { x: 5, y: 0 },
      ],
    },
  ],
}

// Multiple circuit files for demonstration
const circuitFiles = {
  "basic-resistor-capacitor.json": exampleCircuitJson,
  "simple-circuit.json": {
    ...exampleCircuitJson,
    lb: {
      ...exampleCircuitJson.lb,
      LED1: {
        type: "led",
        name: "LED1",
        pcb_x: 10,
        pcb_y: 0,
        pin0: { x: 10, y: 0 },
        pin1: { x: 12.54, y: 0 },
      },
    },
  },
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
