import { RunFrame } from "lib/components/RunFrame/RunFrame"
import React, { useEffect, useState } from "react"

export default () => {
  const [fsMap, setFsMap] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFsMap({
        "index.tsx": `
        // edit me
        circuit.add(
        <board width="10mm" height="10mm">
          <resistor name="R1" resistance="1k" footprint="0402" />
          <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={4} />
          <trace from=".R1 .pin1" to=".C1 .pin1" />
        </board>
        )`.trim(),
      })
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <RunFrame fsMap={fsMap} entrypoint="index.tsx" isLoadingFiles={isLoading} />
  )
}
