import { useLocalStorageState } from "lib/hooks/use-local-storage-state"
import { useCallback, useState, useEffect } from "react"
import { CircuitJsonPreview } from "../CircuitJsonPreview/CircuitJsonPreview"
import { StaticBuildFileMenu } from "./StaticBuildFileMenu"
import { CircuitJsonFileSelector } from "./CircuitJsonFileSelector"
import type { CircuitJson } from "circuit-json"

export interface RunFrameStaticBuildViewerProps {
  /**
   * Map of file paths to circuit JSON data
   */
  circuitJsonFiles: Record<string, CircuitJson>
  
  /**
   * Initial file to display
   */
  initialFile?: string
  
  /**
   * Debug mode
   */
  debug?: boolean
  
  /**
   * Additional content for the scenario selector area
   */
  scenarioSelectorContent?: React.ReactNode
  
  /**
   * Project name for exports
   */
  projectName?: string
  
  /**
   * Whether this is embedded in a web page
   */
  isWebEmbedded?: boolean
}

export const RunFrameStaticBuildViewer = (props: RunFrameStaticBuildViewerProps) => {
  const {
    circuitJsonFiles,
    initialFile,
    debug = false,
    scenarioSelectorContent,
    projectName = "circuit",
    isWebEmbedded = false,
  } = props

  // Get available file paths
  const availableFiles = Object.keys(circuitJsonFiles)
  
  // State for currently selected file
  const [selectedFile, setSelectedFile] = useState<string>(() => {
    if (initialFile && circuitJsonFiles[initialFile]) {
      return initialFile
    }
    return availableFiles[0] || ""
  })

  // Get current circuit JSON
  const currentCircuitJson = selectedFile ? circuitJsonFiles[selectedFile] : null

  // Handle file selection change
  const handleFileChange = useCallback((filePath: string) => {
    if (circuitJsonFiles[filePath]) {
      setSelectedFile(filePath)
    }
  }, [circuitJsonFiles])

  // Update selected file if initialFile changes
  useEffect(() => {
    if (initialFile && circuitJsonFiles[initialFile] && selectedFile !== initialFile) {
      setSelectedFile(initialFile)
    }
  }, [initialFile, circuitJsonFiles, selectedFile])

  return (
    <CircuitJsonPreview
      circuitJson={currentCircuitJson}
      defaultToFullScreen={true}
      showToggleFullScreen={false}
      showFileMenu={false}
      isWebEmbedded={isWebEmbedded}
      leftHeaderContent={
        <div className="rf-flex rf-items-center rf-justify-between rf-w-full">
          <StaticBuildFileMenu
            circuitJson={currentCircuitJson}
            projectName={projectName}
            isWebEmbedded={isWebEmbedded}
          />
          {scenarioSelectorContent}
          {availableFiles.length > 1 && (
            <div className="rf-absolute rf-left-1/2 rf-transform rf--translate-x-1/2">
              <CircuitJsonFileSelector
                currentFile={selectedFile}
                files={availableFiles}
                onFileChange={handleFileChange}
              />
            </div>
          )}
        </div>
      }
      showCodeTab={false}
      showRenderLogTab={false}
      availableTabs={["pcb", "schematic", "assembly", "pinout", "cad", "bom", "circuit_json"]}
      defaultActiveTab="pcb"
    />
  )
}
