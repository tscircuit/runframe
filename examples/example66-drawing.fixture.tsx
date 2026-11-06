import type { CircuitJson } from "circuit-json"
import { useEffect, useState } from "react"
import { CircuitJsonPreview } from "../lib/components/CircuitJsonPreview/CircuitJsonPreview"
import type { PreviewContentProps } from "../lib/components/CircuitJsonPreview/PreviewContentProps"
import { createDrawingCircuitJson } from "./assets/drawing"

function DrawingPreview(
  props: Pick<PreviewContentProps, "availableTabs" | "defaultActiveTab">,
) {
  const [circuitJson, setCircuitJson] = useState<CircuitJson>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    let cancelled = false
    void createDrawingCircuitJson().then(
      (circuitJson) => {
        if (!cancelled) setCircuitJson(circuitJson)
      },
      (error: unknown) => {
        if (!cancelled)
          setError(error instanceof Error ? error.message : String(error))
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  if (error !== undefined) return <p role="alert">{error}</p>
  if (!circuitJson) return <p role="status">Preparing drawing…</p>
  return (
    <CircuitJsonPreview
      {...props}
      circuitJson={circuitJson}
      allowSelectingVersion={false}
    />
  )
}

export default {
  "Choose Drawing from More views": () => <DrawingPreview />,
  "Drawing pages and section views": () => (
    <DrawingPreview availableTabs={["drawing"]} defaultActiveTab="drawing" />
  ),
  "No drawings": () => (
    <CircuitJsonPreview
      circuitJson={[]}
      defaultActiveTab="drawing"
      allowSelectingVersion={false}
    />
  ),
}
