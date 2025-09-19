import { RunFrameStaticBuildViewer } from "lib/components/RunFrameStaticBuildViewer"
import { autoLoadCircuitJsonFiles } from "lib/utils/autoLoadCircuitJsonFiles"
import React, { useState, useEffect, useCallback } from "react"

const mockCircuitAPI = {
  async fetchCircuitList(): Promise<string[]> {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return [
      "async-circuit-1.json",
      "async-circuit-2.json",
      "async-circuit-3.json",
    ]
  },

  async fetchCircuitData(filename: string): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const circuitNumber = filename.match(/(\d+)/)?.[0] || "1"

    return {
      lb: {
        [`R${circuitNumber}`]: {
          type: "resistor",
          resistance: `${circuitNumber}k`,
          name: `R${circuitNumber}`,
          pcb_x: 0,
          pcb_y: 0,
          pin0: { x: 0, y: 0 },
          pin1: { x: 2.54, y: 0 },
        },
        [`C${circuitNumber}`]: {
          type: "capacitor",
          capacitance: `${circuitNumber}uF`,
          name: `C${circuitNumber}`,
          pcb_x: 5,
          pcb_y: 0,
          pin0: { x: 5, y: 0 },
          pin1: { x: 7.54, y: 0 },
        },
      },
      circuit_connections: [
        {
          from: { component: `R${circuitNumber}`, port: "pin1" },
          to: { component: `C${circuitNumber}`, port: "pin0" },
        },
      ],
      pcb_components: [
        {
          name: `R${circuitNumber}`,
          pcb_x: 0,
          pcb_y: 0,
          rotation: 0,
          footprint: "0402",
        },
        {
          name: `C${circuitNumber}`,
          pcb_x: 5,
          pcb_y: 0,
          rotation: 0,
          footprint: "0603",
        },
      ],
      pcb_traces: [
        {
          from: { component: `R${circuitNumber}`, port: "pin1" },
          to: { component: `C${circuitNumber}`, port: "pin0" },
          route: [
            { x: 2.54, y: 0 },
            { x: 5, y: 0 },
          ],
        },
      ],
    }
  },
}

const AsyncCircuitViewer = () => {
  const [circuitFiles, setCircuitFiles] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilename, setSelectedFilename] = useState<string>("")

  const loadCircuitFiles = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const circuitList = await mockCircuitAPI.fetchCircuitList()

      const circuitPromises = circuitList.map(async (filename) => {
        const data = await mockCircuitAPI.fetchCircuitData(filename)
        return { filename, data }
      })

      const loadedCircuits = await Promise.all(circuitPromises)

      const circuitRecord: Record<string, any> = {}
      loadedCircuits.forEach(({ filename, data }) => {
        circuitRecord[filename] = data
      })

      setCircuitFiles(circuitRecord)
      setSelectedFilename(circuitList[0] || "")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load circuits")
      console.error("Error loading circuit files:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCircuitFiles()
  }, [loadCircuitFiles])

  const handleFileChange = useCallback((filename: string, circuitJson: any) => {
    console.log(`File changed to: ${filename}`, circuitJson)
    setSelectedFilename(filename)
  }, [])

  const handleCircuitLoaded = useCallback(
    (circuitJson: any, filename: string) => {
      console.log(`Circuit loaded: ${filename}`, circuitJson)
    },
    [],
  )

  const handleExport = useCallback((format: string, filename: string) => {
    console.log(`Exporting ${filename} as ${format}`)
    alert(`Exporting ${filename} as ${format} format`)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Loading Circuits
          </h3>
          <p className="text-gray-600">Fetching circuit data from server...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Failed to Load Circuits
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={loadCircuitFiles}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (Object.keys(circuitFiles).length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Circuits Available
          </h3>
          <p className="text-gray-600">No circuit files were found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <RunFrameStaticBuildViewer
        circuitJsonFiles={circuitFiles}
        defaultFilename={selectedFilename}
        debug={true}
        showFileSelector={true}
        showFileMenu={true}
        exportFormats={["json", "zip", "glb"]}
        onFileChange={handleFileChange}
        onCircuitJsonLoaded={handleCircuitLoaded}
        onExport={handleExport}
        className="border rounded-lg"
      />
    </div>
  )
}

export default () => (
  <div className="h-screen bg-gray-100">
    <div className="h-full p-4">
      <div className="bg-white rounded-lg shadow-sm h-full overflow-hidden">
        <AsyncCircuitViewer />
      </div>
    </div>
  </div>
)
