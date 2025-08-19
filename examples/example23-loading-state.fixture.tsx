import { RunFrame } from "lib/components/RunFrame/RunFrame"
import React, { useEffect, useState } from "react"

export default () => {
  const [fsMap, setFsMap] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFsMap({
        "index.tsx": `
export default () => (
  <board width="10mm" height="10mm">
    <resistor name="R1" resistance="1k" footprint="0402" />
  </board>
)
        `.trim(),
      })
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <RunFrame fsMap={fsMap} entrypoint="index.tsx" isLoadingFiles={isLoading} />
  )
}
