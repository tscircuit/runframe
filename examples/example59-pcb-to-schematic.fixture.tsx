import { useState } from "react"
import { CircuitJsonPreview } from "../lib/components/CircuitJsonPreview/CircuitJsonPreview"
import { RunFrame } from "../lib/components/RunFrame/RunFrame"
import { renderToCircuitJson } from "../lib/dev/render-to-circuit-json"

const circuitJson = renderToCircuitJson(
  <board width="30mm" height="20mm" routingDisabled>
    <chip
      name="U1"
      footprint="soic8"
      manufacturerPartNumber="NE555DR"
      pcbX={-6}
      schX={-8}
    />
    <chip
      name="U2"
      footprint="dip8"
      manufacturerPartNumber="NE555P"
      pcbX={6}
      schX={8}
    />
  </board>,
)
const fsMap = new Map([["main.circuit.json", JSON.stringify(circuitJson)]])

function PcbToSchematic({ runFrame = false }: { runFrame?: boolean }) {
  const [schematicEnabled, setSchematicEnabled] = useState(true)
  const availableTabs = schematicEnabled
    ? (["pcb", "schematic"] as const)
    : (["pcb"] as const)
  return (
    <div style={{ height: "100vh" }}>
      <div style={{ padding: 12, fontFamily: "sans-serif" }}>
        Click a pad on U1 (left) or U2 (right), then choose “on Schematic”. The
        schematic opens centered on that chip. Return to PCB to try the other
        chip.
        <label style={{ display: "block", marginTop: 8 }}>
          <input
            type="checkbox"
            checked={schematicEnabled}
            onChange={(event) => setSchematicEnabled(event.target.checked)}
          />
          Schematic tab enabled
        </label>
      </div>
      {runFrame ? (
        <RunFrame
          fsMap={fsMap}
          mainComponentPath="main.circuit.json"
          defaultActiveTab="pcb"
          availableTabs={[...availableTabs]}
        />
      ) : (
        <CircuitJsonPreview
          circuitJson={circuitJson}
          defaultActiveTab="pcb"
          availableTabs={[...availableTabs]}
          allowSelectingVersion={false}
        />
      )}
    </div>
  )
}

export default {
  CircuitJsonPreview: <PcbToSchematic />,
  RunFrame: <PcbToSchematic runFrame />,
}
