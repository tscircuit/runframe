import { RunFrame } from "lib/runner"
import React from "react"
import { createRoot } from "react-dom/client"

const root = createRoot(document.getElementById("root")!)

root.render(
  <React.StrictMode>
    <div style={{ width: "100vw", height: "100vh" }}>
      <RunFrame
        fsMap={{
          "main.tsx": `
circuit.add(
<board width="10mm" height="10mm">
  <resistor name="R1" resistance="1k" footprint="0402" />
  <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={4} />
  <trace from=".R1 .pin1" to=".C1 .pin1" />
</board>
)`,
        }}
        entrypoint="main.tsx"
        showRunButton={true}
        debug={window.location.search.includes("debug")}
      />
    </div>
  </React.StrictMode>,
)
