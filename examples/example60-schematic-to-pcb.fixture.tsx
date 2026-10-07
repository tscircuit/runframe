import { useState } from "react"
import { CircuitJsonPreview } from "../lib/components/CircuitJsonPreview/CircuitJsonPreview"
import { RunFrame } from "../lib/components/RunFrame/RunFrame"
import { renderToCircuitJson } from "../lib/dev/render-to-circuit-json"

const circuitJson = renderToCircuitJson(
  <board width="30mm" height="20mm" routingDisabled>
    <chip name="U1" footprint="soic8" pcbX={-6} schX={-8} />
    <chip name="U2" footprint="soic8" layer="bottom" pcbX={6} schX={8} />
  </board>,
)
const fsMap = new Map([["main.circuit.json", JSON.stringify(circuitJson)]])

function SchematicToPcb({ runFrame = false }: { runFrame?: boolean }) {
  const [pcbEnabled, setPcbEnabled] = useState(true)
  const availableTabs = pcbEnabled
    ? (["schematic", "pcb", "cad"] as const)
    : (["schematic", "cad"] as const)
  return (
    <div style={{ height: "100vh" }}>
      <div style={{ padding: 12, fontFamily: "sans-serif" }}>
        Right-click U1 or U2 in the schematic and choose Show on PCB. The PCB
        opens centered on that chip with its layer selected and a blue outline.
        Return to Schematic to try the other chip.
        <label style={{ display: "block", marginTop: 8 }}>
          <input
            type="checkbox"
            checked={pcbEnabled}
            onChange={(event) => setPcbEnabled(event.target.checked)}
          />
          PCB tab enabled
        </label>
      </div>
      {runFrame ? (
        <RunFrame
          fsMap={fsMap}
          mainComponentPath="main.circuit.json"
          defaultActiveTab="schematic"
          availableTabs={[...availableTabs]}
        />
      ) : (
        <CircuitJsonPreview
          circuitJson={circuitJson}
          defaultActiveTab="schematic"
          availableTabs={[...availableTabs]}
          allowSelectingVersion={false}
        />
      )}
    </div>
  )
}

export default {
  CircuitJsonPreview: () => <SchematicToPcb />,
  RunFrame: () => <SchematicToPcb runFrame />,
}
