import { RunFrameStaticBuildViewer } from "lib/components/RunFrameStaticBuildViewer/RunFrameStaticBuildViewer"
import { autoLoadCircuitJsonFiles } from "lib/components/RunFrameStaticBuildViewer/utils/loadCircuitJsonFiles"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"
import { useEffect, useState } from "react"
import type { CircuitJson } from "circuit-json"

export default () => {
  const [circuitJsonFiles, setCircuitJsonFiles] = useState<Record<string, CircuitJson> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFiles = async () => {
      try {
        // Simulate loading from different sources
        const files = await autoLoadCircuitJsonFiles({
          // In a real scenario, these would be URLs to actual circuit JSON files
          "main.circuit.json": JSON.stringify(renderToCircuitJson(
            <board width="20mm" height="15mm">
              <resistor name="R1" resistance="1k" footprint="0402" />
              <capacitor name="C1" capacitance="10uF" footprint="0603" pcbX={5} />
              <trace from=".R1 .pin2" to=".C1 .pin1" />
            </board>
          )),
          "test.circuit.json": JSON.stringify(renderToCircuitJson(
            <board width="10mm" height="10mm">
              <led name="LED1" footprint="0603" />
            </board>
          )),
          // This one is already a parsed object
          "parsed.circuit.json": renderToCircuitJson(
            <board width="15mm" height="12mm">
              <chip name="U1" footprint="soic8" />
              <resistor name="R1" resistance="10k" footprint="0402" pcbX={-3} />
            </board>
          ),
        })
        
        setCircuitJsonFiles(files)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load circuit files")
      } finally {
        setLoading(false)
      }
    }

    loadFiles()
  }, [])

  if (loading) {
    return (
      <div className="rf-flex rf-items-center rf-justify-center rf-h-64">
        <div className="rf-text-gray-600">Loading circuit files...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rf-flex rf-items-center rf-justify-center rf-h-64">
        <div className="rf-text-red-600">Error: {error}</div>
      </div>
    )
  }

  if (!circuitJsonFiles || Object.keys(circuitJsonFiles).length === 0) {
    return (
      <div className="rf-flex rf-items-center rf-justify-center rf-h-64">
        <div className="rf-text-gray-600">No circuit files found</div>
      </div>
    )
  }

  return (
    <RunFrameStaticBuildViewer
      circuitJsonFiles={circuitJsonFiles}
      initialFile="main.circuit.json"
      projectName="Async Loaded Project"
      scenarioSelectorContent={
        <div className="rf-text-xs rf-text-gray-600">
          Async Loading Demo
        </div>
      }
    />
  )
}
