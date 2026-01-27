
import { RunFrame } from "lib/components/RunFrame/RunFrame"
import React, { useState } from "react"

export default () => {
  const [code, setCode] = useState(
    `
// edit me
circuit.add(
<board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicpath
              points={[]}
              svgPath="M 0 0 L 2 0 Q 3 0 3 1 L 3 3 C 3 4 2 5 1 5 L 0 5 A 1 1 0 0 1 -1 4 L -1 1 Z"
              strokeColor="#000000"
              isFilled={false}
              strokeWidth={0.05}
            />
          </symbol>
        }
      />
    </board>
  )`.trim(),
  )

  return (
    <div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
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
        fsMap={{
          "main.tsx": code,
        }}
        entrypoint="main.tsx"
        showRunButton={true}
      />
    </div>
  )
}
