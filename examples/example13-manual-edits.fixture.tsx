import { RunFrame } from "lib/components/RunFrame/RunFrame"
import { useState } from "react"

export default () => {
  const code = `
  import manualEdits from "./manual-edits.json"

  circuit.add(
<board width="10mm" height="10mm" manualEdits={manualEdits}>
  <resistor name="R1" resistance="1k" footprint="0402" />
  <capacitor name="C1" capacitance="1uF" footprint="0603" />
  <trace from=".R1 .pin1" to=".C1 .pin1" />
  </board>
  )`
  const [manualEdits, setManualEdits] = useState(
    `{
          "pcb_placements": [
            {
              "selector": "C1",
              "center": {
                "x": 5,
                "y": 5
              },
              "relative_to": "group_center"
            }
          ],
          "edit_events": [],
          "manual_trace_hints": []
        }`.trim(),
  )
  const [fsMap, setFsMap] = useState({
    "entrypoint.tsx": code,
    "manual-edits.json": manualEdits,
  })

  return (
    <div>
      <textarea
        value={manualEdits}
        onChange={(e) => {
          const newValue = e.target.value
          setManualEdits(newValue)
          setFsMap((prev) => ({
            ...prev,
            "manual-edits.json": newValue,
          }))
        }}
        style={{
          width: "100%",
          margin: "1rem",
          border: "1px solid #ccc",
          padding: "1rem",
          fontFamily: "monospace",
          height: "200px",
          marginBottom: "1rem",
        }}
      />
      <RunFrame
        fsMap={fsMap}
        entrypoint="entrypoint.tsx"
        showRunButton={true}
        onFsMapUpdate={(updatedFsMap) => {
          setFsMap(updatedFsMap)
          setManualEdits(updatedFsMap["manual-edits.json"])
        }}
      />
    </div>
  )
}
