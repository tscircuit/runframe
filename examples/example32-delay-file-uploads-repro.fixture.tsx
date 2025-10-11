import { RunFrame } from "lib/components/RunFrame/RunFrame"
import React, { useEffect, useState } from "react"

export default () => {
  const [fsMap, setFsMap] = useState<Record<string, string>>({
    "main.tsx": `
import { partName } from "./util.ts"

circuit.add(
  <board width="10mm" height="10mm">
    <resistor name={partName} resistance="1k" footprint="0402" />
  </board>
)
`.trim(),
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setFsMap((prev) => ({
        ...prev,
        "util.ts": `export const partName = "R1"`,
      }))
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="rf-space-y-3 rf-p-4">
      <RunFrame
        fsMap={fsMap}
        entrypoint="main.tsx"
        showRunButton={true}
        defaultActiveTab="errors"
      />
    </div>
  )
}
