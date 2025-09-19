import { RunFrameStaticBuildViewer } from "lib/components/RunFrameStaticBuildViewer/RunFrameStaticBuildViewer"
import { circuitJsonFileLoader } from "lib/components/RunFrameStaticBuildViewer/utils/loadCircuitJsonFiles"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"
import { useEffect, useState } from "react"
import type { CircuitJson } from "circuit-json"

/**
 * This example demonstrates how RunFrameStaticBuildViewer would be integrated
 * into tscircuit.com for viewing prebuilt projects.
 * 
 * The URL structure would be something like:
 * https://tscircuit.com/seveibar/led-water-accelerometer/releases/8b90619f-14ef-4c5a-89f1-2476566c08a5/preview
 */

interface TscircuitIntegrationProps {
  // These would come from the URL parameters in a real implementation
  username?: string
  projectName?: string
  releaseId?: string
  baseUrl?: string
}

const TscircuitIntegration = ({
  username = "seveibar",
  projectName = "led-water-accelerometer", 
  releaseId = "8b90619f-14ef-4c5a-89f1-2476566c08a5",
  baseUrl = "https://api.tscircuit.com"
}: TscircuitIntegrationProps) => {
  const [circuitJsonFiles, setCircuitJsonFiles] = useState<Record<string, CircuitJson> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProjectFiles = async () => {
      try {
        // In a real implementation, this would fetch the list of available circuit JSON files
        // from the tscircuit.com API for the specific release
        const releaseApiUrl = `${baseUrl}/projects/${username}/${projectName}/releases/${releaseId}`
        
        // For this demo, we'll simulate the expected file structure
        const mockFilePaths = [
          "main.circuit.json",
          "test.circuit.json", 
          "production.circuit.json"
        ]
        
        // Simulate loading circuit JSON files from the release
        const files = await circuitJsonFileLoader.loadFromObjects({
          "main.circuit.json": renderToCircuitJson(
            <board width="25mm" height="20mm">
              <chip name="U1" footprint="soic8" pcbX={0} pcbY={5} />
              <resistor name="R1" resistance="10k" footprint="0402" pcbX={-8} pcbY={0} />
              <resistor name="R2" resistance="1k" footprint="0402" pcbX={8} pcbY={0} />
              <capacitor name="C1" capacitance="100nF" footprint="0603" pcbX={0} pcbY={-5} />
              <led name="LED1" footprint="0603" pcbX={0} pcbY={-10} />
              <trace from=".U1 .pin1" to=".R1 .pin1" />
              <trace from=".U1 .pin2" to=".R2 .pin1" />
              <trace from=".U1 .pin3" to=".C1 .pin1" />
              <trace from=".C1 .pin2" to=".LED1 .anode" />
            </board>
          ),
          "test.circuit.json": renderToCircuitJson(
            <board width="15mm" height="10mm">
              <resistor name="R_TEST" resistance="1k" footprint="0402" />
              <led name="LED_TEST" footprint="0603" pcbX={5} />
              <trace from=".R_TEST .pin2" to=".LED_TEST .anode" />
            </board>
          ),
          "production.circuit.json": renderToCircuitJson(
            <board width="30mm" height="25mm">
              <chip name="MCU" footprint="qfn32" pcbX={0} pcbY={0} />
              <resistor name="R1" resistance="10k" footprint="0402" pcbX={-10} pcbY={8} />
              <resistor name="R2" resistance="10k" footprint="0402" pcbX={10} pcbY={8} />
              <capacitor name="C1" capacitance="22pF" footprint="0603" pcbX={-10} pcbY={-8} />
              <capacitor name="C2" capacitance="22pF" footprint="0603" pcbX={10} pcbY={-8} />
              <trace from=".MCU .pin1" to=".R1 .pin1" />
              <trace from=".MCU .pin2" to=".R2 .pin1" />
            </board>
          )
        })
        
        setCircuitJsonFiles(files)
      } catch (err) {
        console.error("Failed to load project files:", err)
        setError(err instanceof Error ? err.message : "Failed to load project files")
      } finally {
        setLoading(false)
      }
    }

    loadProjectFiles()
  }, [username, projectName, releaseId, baseUrl])

  if (loading) {
    return (
      <div className="rf-flex rf-items-center rf-justify-center rf-h-64">
        <div className="rf-text-gray-600">Loading project...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rf-flex rf-items-center rf-justify-center rf-h-64 rf-flex-col rf-gap-2">
        <div className="rf-text-red-600">Failed to load project</div>
        <div className="rf-text-sm rf-text-gray-500">{error}</div>
      </div>
    )
  }

  if (!circuitJsonFiles || Object.keys(circuitJsonFiles).length === 0) {
    return (
      <div className="rf-flex rf-items-center rf-justify-center rf-h-64">
        <div className="rf-text-gray-600">No circuit files found in this release</div>
      </div>
    )
  }

  return (
    <RunFrameStaticBuildViewer
      circuitJsonFiles={circuitJsonFiles}
      initialFile="main.circuit.json"
      projectName={`${username}/${projectName}`}
      isWebEmbedded={true}
      scenarioSelectorContent={
        <div className="rf-flex rf-items-center rf-gap-2 rf-text-xs rf-text-gray-600">
          <span>{username}/{projectName}</span>
          <span className="rf-text-gray-400">•</span>
          <span>Release {releaseId.slice(0, 8)}</span>
        </div>
      }
    />
  )
}

export default () => <TscircuitIntegration />
