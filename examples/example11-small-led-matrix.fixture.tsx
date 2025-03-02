import { RunFrame } from "lib/components/RunFrame/RunFrame"
import React from "react"

export default () => (
  <RunFrame
    fsMap={{
      "main.tsx": `
import { Fragment } from "react"

circuit.add(
      <board
        width="10mm"
        height="100mm"
        autorouter={{
          local: true,
          groupMode: "subcircuit",
        }}
      >
      {Array.from({ length: 30 }).map((_, i) => (
        <Fragment key={i.toString()}>
          <capacitor
            capacitance="1000pF"
            footprint="0402"
            name={\`C\${i}\`}
            schX={-3}
            pcbX={-3}
            pcbY={(i / 30 - 0.5) * 60}
          />
          <resistor
            resistance="1k"
            footprint="0402"
            name={\`R\${i}\`}
            schX={3}
            pcbX={3}
            pcbY={(i / 30 - 0.5) * 60}
          />
          <trace from={\`.R\${i} > .pin1\`} to={\`.C\${i} > .pin1\`} />
        </Fragment>
      ))}
    </board>
)
`,
      "manual-edits.json": "{}",
    }}
    defaultActiveTab="pcb"
    entrypoint="main.tsx"
    showRunButton
  />
)
