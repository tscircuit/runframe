import { RunFrame } from "lib/components/RunFrame/RunFrame"
import React, { useState } from "react"

export default () => {
  const [fsMap, setFsMap] = useState<Record<string, string>>({
    "main.tsx": `
import {XiaoBoard} from "@tscircuit/common"
circuit.add(
<XiaoBoard name="U1" variant="RP2040" />
)`.trim(),
  })
  const [entrypoint, setEntrypoint] = useState("main.tsx")

  return (
    <div>
      <div className="rf-space-y-4 rf-p-4">
        <h3 className="rf-text-lg rf-font-semibold">Error Cases Demo</h3>

        <textarea
          value={fsMap["main.tsx"] || ""}
          disabled={true}
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
