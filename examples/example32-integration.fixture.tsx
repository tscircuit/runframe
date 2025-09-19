import { RunFrameStaticBuildViewer } from "lib/components/RunFrameStaticBuildViewer"
import { autoLoadCircuitJsonFiles } from "lib/utils/autoLoadCircuitJsonFiles"
import React, { useState, useEffect, useCallback, useMemo } from "react"

const circuitDatabase = {
  "amplifier-circuit.json": {
    name: "Audio Amplifier",
    description: "Simple audio amplifier circuit",
    complexity: "medium",
    lb: {
      Q1: {
        type: "transistor",
        subtype: "npn",
        name: "Q1",
        pcb_x: 10,
        pcb_y: 10,
        pin0: { x: 10, y: 10 },
        pin1: { x: 12, y: 12 },
        pin2: { x: 8, y: 12 },
      },
      R1: {
        type: "resistor",
        resistance: "10k",
        name: "R1",
        pcb_x: 5,
        pcb_y: 5,
        pin0: { x: 5, y: 5 },
        pin1: { x: 7.54, y: 5 },
      },
      R2: {
        type: "resistor",
        resistance: "1k",
        name: "R2",
        pcb_x: 15,
        pcb_y: 15,
        pin0: { x: 15, y: 15 },
        pin1: { x: 17.54, y: 15 },
      },
      C1: {
        type: "capacitor",
        capacitance: "10uF",
        name: "C1",
        pcb_x: 20,
        pcb_y: 10,
        pin0: { x: 20, y: 10 },
        pin1: { x: 22.54, y: 10 },
      },
    },
    circuit_connections: [
      {
        from: { component: "R1", port: "pin1" },
        to: { component: "Q1", port: "pin0" },
      },
      {
        from: { component: "Q1", port: "pin1" },
        to: { component: "R2", port: "pin0" },
      },
      {
        from: { component: "Q1", port: "pin2" },
        to: { component: "C1", port: "pin0" },
      },
    ],
    pcb_components: [
      { name: "Q1", pcb_x: 10, pcb_y: 10, rotation: 0, footprint: "to92" },
      { name: "R1", pcb_x: 5, pcb_y: 5, rotation: 0, footprint: "0402" },
      { name: "R2", pcb_x: 15, pcb_y: 15, rotation: 0, footprint: "0402" },
      { name: "C1", pcb_x: 20, pcb_y: 10, rotation: 0, footprint: "0603" },
    ],
    pcb_traces: [
      {
        from: { component: "R1", port: "pin1" },
        to: { component: "Q1", port: "pin0" },
        route: [
          { x: 7.54, y: 5 },
          { x: 10, y: 10 },
        ],
      },
      {
        from: { component: "Q1", port: "pin1" },
        to: { component: "R2", port: "pin0" },
        route: [
          { x: 12, y: 12 },
          { x: 15, y: 15 },
        ],
      },
      {
        from: { component: "Q1", port: "pin2" },
        to: { component: "C1", port: "pin0" },
        route: [
          { x: 8, y: 12 },
          { x: 20, y: 10 },
        ],
      },
    ],
  },
  "power-supply.json": {
    name: "Power Supply",
    description: "5V regulated power supply",
    complexity: "high",
    lb: {
      U1: {
        type: "ic",
        name: "U1",
        pcb_x: 15,
        pcb_y: 15,
        pin0: { x: 15, y: 15 },
        pin1: { x: 17, y: 15 },
        pin2: { x: 19, y: 15 },
        pin3: { x: 15, y: 17 },
      },
      C1: {
        type: "capacitor",
        capacitance: "100uF",
        name: "C1",
        pcb_x: 5,
        pcb_y: 15,
        pin0: { x: 5, y: 15 },
        pin1: { x: 7.54, y: 15 },
      },
      C2: {
        type: "capacitor",
        capacitance: "10uF",
        name: "C2",
        pcb_x: 25,
        pcb_y: 15,
        pin0: { x: 25, y: 15 },
        pin1: { x: 27.54, y: 15 },
      },
      R1: {
        type: "resistor",
        resistance: "240",
        name: "R1",
        pcb_x: 30,
        pcb_y: 20,
        pin0: { x: 30, y: 20 },
        pin1: { x: 32.54, y: 20 },
      },
      LED1: {
        type: "led",
        name: "LED1",
        pcb_x: 35,
        pcb_y: 20,
        pin0: { x: 35, y: 20 },
        pin1: { x: 37.54, y: 20 },
      },
    },
    circuit_connections: [
      {
        from: { component: "C1", port: "pin1" },
        to: { component: "U1", port: "pin0" },
      },
      {
        from: { component: "U1", port: "pin1" },
        to: { component: "C2", port: "pin0" },
      },
      {
        from: { component: "U1", port: "pin2" },
        to: { component: "R1", port: "pin0" },
      },
      {
        from: { component: "R1", port: "pin1" },
        to: { component: "LED1", port: "pin0" },
      },
    ],
    pcb_components: [
      { name: "U1", pcb_x: 15, pcb_y: 15, rotation: 0, footprint: "so8" },
      { name: "C1", pcb_x: 5, pcb_y: 15, rotation: 0, footprint: "1206" },
      { name: "C2", pcb_x: 25, pcb_y: 15, rotation: 0, footprint: "0805" },
      { name: "R1", pcb_x: 30, pcb_y: 20, rotation: 0, footprint: "0402" },
      { name: "LED1", pcb_x: 35, pcb_y: 20, rotation: 0, footprint: "0603" },
    ],
    pcb_traces: [
      {
        from: { component: "C1", port: "pin1" },
        to: { component: "U1", port: "pin0" },
        route: [
          { x: 7.54, y: 15 },
          { x: 15, y: 15 },
        ],
      },
      {
        from: { component: "U1", port: "pin1" },
        to: { component: "C2", port: "pin0" },
        route: [
          { x: 17, y: 15 },
          { x: 25, y: 15 },
        ],
      },
      {
        from: { component: "U1", port: "pin2" },
        to: { component: "R1", port: "pin0" },
        route: [
          { x: 19, y: 15 },
          { x: 30, y: 20 },
        ],
      },
      {
        from: { component: "R1", port: "pin1" },
        to: { component: "LED1", port: "pin0" },
        route: [
          { x: 32.54, y: 20 },
          { x: 35, y: 20 },
        ],
      },
    ],
  },
  "filter-circuit.json": {
    name: "RC Filter",
    description: "Low-pass RC filter",
    complexity: "low",
    lb: {
      R1: {
        type: "resistor",
        resistance: "1k",
        name: "R1",
        pcb_x: 10,
        pcb_y: 10,
        pin0: { x: 10, y: 10 },
        pin1: { x: 12.54, y: 10 },
      },
      C1: {
        type: "capacitor",
        capacitance: "100nF",
        name: "C1",
        pcb_x: 15,
        pcb_y: 15,
        pin0: { x: 15, y: 15 },
        pin1: { x: 17.54, y: 15 },
      },
    },
    circuit_connections: [
      {
        from: { component: "R1", port: "pin1" },
        to: { component: "C1", port: "pin0" },
      },
    ],
    pcb_components: [
      { name: "R1", pcb_x: 10, pcb_y: 10, rotation: 0, footprint: "0402" },
      { name: "C1", pcb_x: 15, pcb_y: 15, rotation: 0, footprint: "0402" },
    ],
    pcb_traces: [
      {
        from: { component: "R1", port: "pin1" },
        to: { component: "C1", port: "pin0" },
        route: [
          { x: 12.54, y: 10 },
          { x: 15, y: 15 },
        ],
      },
    ],
  },
}

class CircuitAPIService {
  private circuits: Record<string, any> = circuitDatabase

  async getCircuitList(): Promise<
    Array<{
      filename: string
      name: string
      description: string
      complexity: string
    }>
  > {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return Object.entries(this.circuits).map(([filename, circuit]) => ({
      filename,
      name: circuit.name,
      description: circuit.description,
      complexity: circuit.complexity,
    }))
  }

  async getCircuit(filename: string): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const circuit = this.circuits[filename]
    if (!circuit) {
      throw new Error(`Circuit not found: ${filename}`)
    }
    return circuit
  }

  async exportCircuit(filename: string, format: string): Promise<Blob> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const circuit = this.circuits[filename]

    switch (format) {
      case "json":
        return new Blob([JSON.stringify(circuit, null, 2)], {
          type: "application/json",
        })
      case "zip":
        return new Blob([`Mock ZIP content for ${filename}`], {
          type: "application/zip",
        })
      case "glb":
        return new Blob([`Mock GLB content for ${filename}`], {
          type: "model/gltf-binary",
        })
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }
}

const ScenarioSelector: React.FC<{
  onScenarioChange: (scenario: string) => void
  currentScenario: string
}> = ({ onScenarioChange, currentScenario }) => {
  const scenarios = [
    { id: "default", name: "Default View", icon: "👁️" },
    { id: "analysis", name: "Analysis Mode", icon: "📊" },
    { id: "simulation", name: "Simulation", icon: "⚡" },
    { id: "manufacturing", name: "Manufacturing", icon: "🏭" },
  ]

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Scenario:</span>
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => onScenarioChange(scenario.id)}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              currentScenario === scenario.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <span>{scenario.icon}</span>
            {scenario.name}
          </button>
        ))}
      </div>
    </div>
  )
}

const FullIntegrationExample = () => {
  const [circuitFiles, setCircuitFiles] = useState<Record<string, any>>({})
  const [circuitList, setCircuitList] = useState<
    Array<{
      filename: string
      name: string
      description: string
      complexity: string
    }>
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string>("")
  const [selectedScenario, setSelectedScenario] = useState<string>("default")
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<string | null>(null)

  const apiService = useMemo(() => new CircuitAPIService(), [])

  const loadCircuits = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const list = await apiService.getCircuitList()
      setCircuitList(list)

      const circuitPromises = list.map(async (item) => {
        const data = await apiService.getCircuit(item.filename)
        return { filename: item.filename, data }
      })

      const loadedCircuits = await Promise.all(circuitPromises)

      const circuitRecord: Record<string, any> = {}
      loadedCircuits.forEach(({ filename, data }) => {
        circuitRecord[filename] = data
      })

      setCircuitFiles(circuitRecord)
      setSelectedFile(list[0]?.filename || "")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load circuits")
      console.error("Error loading circuits:", err)
    } finally {
      setIsLoading(false)
    }
  }, [apiService])

  useEffect(() => {
    loadCircuits()
  }, [loadCircuits])

  const handleFileChange = useCallback((filename: string, circuitJson: any) => {
    setSelectedFile(filename)
  }, [])

  const handleCircuitLoaded = useCallback(
    (circuitJson: any, filename: string) => {
      const circuitName = circuitJson.name || filename
      document.title = `${circuitName} - Circuit Viewer`
    },
    [],
  )

  const handleExport = useCallback(
    async (format: string, filename: string) => {
      try {
        setIsExporting(true)
        setExportStatus(`Exporting ${filename} as ${format.toUpperCase()}...`)

        const blob = await apiService.exportCircuit(filename, format)

        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${filename.replace(".json", "")}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        setExportStatus(
          `Successfully exported ${filename} as ${format.toUpperCase()}`,
        )
        setTimeout(() => setExportStatus(null), 3000)
      } catch (err) {
        console.error("Export failed:", err)
        setExportStatus(
          `Export failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        )
        setTimeout(() => setExportStatus(null), 5000)
      } finally {
        setIsExporting(false)
      }
    },
    [apiService],
  )

  const handleScenarioChange = useCallback((scenario: string) => {
    setSelectedScenario(scenario)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Circuit Library
          </h3>
          <p className="text-gray-600">
            Preparing your circuit design environment...
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-900 mb-2">
            Failed to Load Circuits
          </h3>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={loadCircuits}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Retry Loading
          </button>
        </div>
      </div>
    )
  }

  const scenarioSelectorContent = (
    <ScenarioSelector
      onScenarioChange={handleScenarioChange}
      currentScenario={selectedScenario}
    />
  )

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Circuit Design Studio
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {circuitList.length} circuits available • {selectedScenario} mode
            </p>
          </div>
          {exportStatus && (
            <div
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                exportStatus.includes("Successfully")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {exportStatus}
            </div>
          )}
          {isExporting && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-600">Exporting...</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-gray-50">
        <RunFrameStaticBuildViewer
          circuitJsonFiles={circuitFiles}
          defaultFilename={selectedFile}
          debug={false}
          scenarioSelectorContent={scenarioSelectorContent}
          defaultActiveTab="pcb"
          defaultToFullScreen={false}
          showToggleFullScreen={true}
          showFileSelector={true}
          showFileMenu={true}
          exportFormats={["json", "zip", "glb", "svg"]}
          onFileChange={handleFileChange}
          onCircuitJsonLoaded={handleCircuitLoaded}
          onExport={handleExport}
          className="h-full"
        />
      </div>

      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Selected:{" "}
            {circuitList.find((c) => c.filename === selectedFile)?.name ||
              "None"}
          </div>
          <div>
            Total Components:{" "}
            {circuitFiles[selectedFile]?.pcb_components?.length || 0}
          </div>
          <div>
            Complexity:{" "}
            {circuitList.find((c) => c.filename === selectedFile)?.complexity ||
              "Unknown"}
          </div>
        </div>
      </div>
    </div>
  )
}

export default () => (
  <div className="h-screen bg-gray-100">
    <FullIntegrationExample />
  </div>
)
