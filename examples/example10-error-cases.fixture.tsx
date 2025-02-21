import { RunFrame } from "lib/components/RunFrame/RunFrame"
import React, { useState } from "react"

export default () => {
  const [fsMap, setFsMap] = useState<Record<string, string>>({
    "main.tsx": `
// edit me
circuit.add(
<board width="10mm" height="10mm">
  <resistor name="R1" resistance="1k" footprint="0402" />
  <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={4} />
  <trace from=".R1 .pin1" to=".C1 .pin1" />
</board>
)`.trim(),
  })
  const [entrypoint, setEntrypoint] = useState("main.tsx")

  return (
    <div>
      <div className="rf-space-y-4 rf-p-4">
        <h3 className="rf-text-lg rf-font-semibold">Error Cases Demo</h3>

        <div>
          <button
            onClick={() => {
              setFsMap({ "main.tsx": "" })
              setEntrypoint("main.tsx")
            }}
            className="rf-px-4 rf-py-2 rf-mr-2 rf-mb-2 rf-bg-red-100 rf-text-red-700 rf-rounded hover:rf-bg-red-200"
          >
            Try Empty Code
          </button>
          <button
            onClick={() => {
              setFsMap({ "main.tsx": "// some code" })
              setEntrypoint("")
            }}
            className="rf-px-4 rf-py-2 rf-mr-2 rf-mb-2 rf-bg-red-100 rf-text-red-700 rf-rounded hover:rf-bg-red-200"
          >
            Try Missing Entrypoint
          </button>
          <button
            onClick={() => {
              setFsMap({
                "main.tsx": `
// edit me
circuit.add(
<board width="10mm" height="10mm">
  <resistor name="R1" resistance="1k" footprint="0402" />
  <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={4} />
  <trace from=".R1 .pin1" to=".C1 .pin1" />
</board>
)`.trim(),
              })
              setEntrypoint("main.tsx")
            }}
            className="rf-px-4 rf-py-2 rf-mb-2 rf-bg-green-100 rf-text-green-700 rf-rounded hover:rf-bg-green-200"
          >
            Reset
          </button>
        </div>

        <textarea
          value={fsMap["main.tsx"] || ""}
          onChange={(e) => setFsMap({ ...fsMap, "main.tsx": e.target.value })}
          style={{
            width: "100%",
            border: "1px solid #ccc",
            padding: "1rem",
            fontFamily: "monospace",
            height: "200px",
            marginBottom: "1rem",
          }}
        />
        <RunFrame fsMap={fsMap} entrypoint={entrypoint} showRunButton={true} />
      </div>
    </div>
  )
}
