import { RunFrame } from "lib/components/RunFrame/RunFrame"
import React, { useState } from "react"

const BrokenComponent = () => {
  throw new Error(
    `Intentional error to test ErrorBoundary - Component crashed!

This is a multiline error message to test how the error fallback UI handles longer error content.

Error Details:
- Component: BrokenComponent
- Location: example41-error-boundary.fixture.tsx
- Cause: Intentional throw for testing purposes

Additional context that might appear in real-world errors:
TypeError: Cannot read properties of undefined (reading 'map')
    at renderCircuitElements (circuit.tsx:142:23)
    at processQueue (scheduler.js:89:12)
    at flushWork (scheduler.js:156:7)`,
  )
}

export default () => {
  const [shouldCrash, setShouldCrash] = useState(false)

  if (shouldCrash) {
    return (
      <div className="rf-h-screen">
        <RunFrame
          fsMap={{
            "main.tsx": `
circuit.add(
<board width="10mm" height="10mm">
  <resistor name="R1" resistance="1k" footprint="0402" />
</board>
)
`,
          }}
          entrypoint="main.tsx"
          leftHeaderContent={<BrokenComponent />}
        />
      </div>
    )
  }

  return (
    <div className="rf-h-screen rf-flex rf-flex-col rf-bg-white">
      <div className="rf-p-4 rf-bg-gray-50 rf-border-b rf-border-gray-200">
        <h3 className="rf-text-lg rf-font-semibold rf-text-gray-900 rf-mb-3">
          Error Boundary Test
        </h3>
        <p className="rf-text-sm rf-text-gray-600 rf-mb-4">
          Click the button below to trigger a React error that will be caught by
          the ErrorBoundary. The error fallback UI should appear with a "Refresh
          Dev Server" button.
        </p>
        <button
          onClick={() => setShouldCrash(true)}
          className="rf-px-4 rf-py-2 rf-bg-red-600 rf-text-white rf-rounded hover:rf-bg-red-700"
        >
          Trigger Error
        </button>
      </div>
      <div className="rf-flex-1">
        <RunFrame
          fsMap={{
            "main.tsx": `
circuit.add(
<board width="10mm" height="10mm">
  <resistor name="R1" resistance="1k" footprint="0402" />
  <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={4} />
  <trace from=".R1 .pin1" to=".C1 .pin1" />
</board>
)
`,
          }}
          entrypoint="main.tsx"
        />
      </div>
    </div>
  )
}
