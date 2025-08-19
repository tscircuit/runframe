import { RunFrame } from "lib/components/RunFrame/RunFrame"
import React, { useEffect, useState } from "react"

export default () => {
  const [fsMap, setFsMap] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFsMap({
        "main.tsx": `
import Resistor from "schematic-symbols/Resistor"

export default () => (
  <Resistor resistance="1k" />
)
        `.trim(),
      })
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <RunFrame fsMap={fsMap} entrypoint="main.tsx" isLoadingFiles={isLoading} />
  )
}
