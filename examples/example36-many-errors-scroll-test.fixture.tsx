import { RunFrame } from "lib/components/RunFrame/RunFrame"
import React from "react"

export default () => {
  // Create valid code that generates many circuit JSON errors
  // by using components with multiple invalid/conflicting properties
  const codeWithManyErrors = `
circuit.add(
  <board width="10mm" height="10mm">
    ${Array.from(
      { length: 15 },
      (_, i) =>
        `<resistor name="R${i + 1}" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />`,
    ).join("\n    ")}
    ${Array.from(
      { length: 15 },
      (_, i) =>
        `<capacitor name="C${i + 1}" capacitance="1uF" footprint="0603" pcbX={0} pcbY={0} />`,
    ).join("\n    ")}
    ${Array.from(
      { length: 15 },
      (_, i) =>
        `<chip name="U${i + 1}" footprint="invalid_footprint" pcbX={0} pcbY={0} />`,
    ).join("\n    ")}
    ${Array.from(
      { length: 15 },
      (_, i) => `<trace from=".R${i + 1} > .pin1" to=".C${i + 1} > .pin1" />`,
    ).join("\n    ")}
  </board>
)
`.trim()

  return (
    <div className="rf-h-screen rf-flex rf-flex-col">
      <h3 className="rf-text-lg rf-font-semibold">
        Many Errors & Warnings Scroll Test
      </h3>
      <div className="rf-flex-1 rf-min-h-0">
        <RunFrame
          fsMap={{ "main.tsx": codeWithManyErrors }}
          entrypoint="main.tsx"
          showRunButton={true}
        />
      </div>
    </div>
  )
}
