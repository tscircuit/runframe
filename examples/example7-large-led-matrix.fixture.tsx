import { RunFrame } from "lib/components/RunFrame"
import React from "react"

export default () => (
  <RunFrame
    fsMap={{
      "main.tsx": `
import LedMatrix from "@tsci/seveibar.contribution-board"

circuit.add(
  <LedMatrix />
)
`,
      "manual-edits.json": "{}",
    }}
    defaultActiveTab="render_log"
    entrypoint="main.tsx"
    // showRenderLogTab
  />
)
