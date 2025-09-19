import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { CircuitJsonPreview } from "../CircuitJsonPreview/CircuitJsonPreview"
import { FileMenuLeftHeader } from "../FileMenuLeftHeader"
import { CircuitJsonFileSelector } from "../CircuitJsonFileSelector"
import { StaticBuildFileMenu } from "../StaticBuildFileMenu"
import { loadCircuitJsonFilesSync } from "lib/utils/autoLoadCircuitJsonFiles"
import { cn } from "lib/utils"
import type { RunFrameStaticBuildViewerProps } from "./RunFrameStaticBuildViewerProps"
import type { CircuitJson } from "circuit-json"
import type { TabId } from "../CircuitJsonPreview/PreviewContentProps"

export const RunFrameStaticBuildViewer = (
  props: RunFrameStaticBuildViewerProps,
) => {
  const {
    circuitJsonFiles,
    defaultFilename = "circuit.json",
    debug = false,
    scenarioSelectorContent,
    defaultActiveTab = "pcb",
    defaultToFullScreen = false,
    showToggleFullScreen = true,
    onCircuitJsonLoaded,
    onFileChange,
    onExport,
    showFileSelector = true,
    showFileMenu = true,
    exportFormats = ["json", "zip", "glb"],
    className
  } = props

  const [circuitJson, setCircuitJson] = useState<CircuitJson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>(defaultActiveTab)
  const [selectedFile, setSelectedFile] = useState<string>(defaultFilename)
  const [availableFiles, setAvailableFiles] = useState<string[]>([])

  useEffect(() => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = loadCircuitJsonFilesSync(circuitJsonFiles, defaultFilename)
      
      setCircuitJson(result.circuitJson)
      setSelectedFile(result.selectedFile)
      setAvailableFiles(result.availableFiles)
      setError(result.error)
      
      if (result.circuitJson && !result.error) {
        onCircuitJsonLoaded?.(result.circuitJson, result.selectedFile)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load circuit files",
      )
    } finally {
      setIsLoading(false)
    }
  }, [circuitJsonFiles, defaultFilename, onCircuitJsonLoaded])

  const handleFileChange = useCallback(
    (filename: string) => {
      const newCircuitJson = circuitJsonFiles[filename]

      setSelectedFile(filename)
      setCircuitJson(newCircuitJson)

      onFileChange?.(filename, newCircuitJson)
      onCircuitJsonLoaded?.(newCircuitJson, filename)
    },
    [circuitJsonFiles, onFileChange, onCircuitJsonLoaded],
  )

  const handleExport = useCallback((format: string, filename: string) => {
    onExport?.(format, filename)
  }, [onExport])

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
          Loading circuit files...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full p-4", className)}>
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
            Failed to Load Circuit Files
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {error}
          </p>
          {availableFiles.length > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Available files: {availableFiles.join(", ")}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!circuitJson) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full p-4", className)}>
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No Circuit Data Available
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please provide circuit JSON files to display.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          {showFileMenu && (
            <StaticBuildFileMenu
              circuitJson={circuitJson}
              currentFile={selectedFile}
              onExport={handleExport}
              exportFormats={exportFormats}
            />
          )}
          
          {showFileSelector && (
            <CircuitJsonFileSelector
              files={availableFiles}
              selectedFile={selectedFile}
              onFileChange={handleFileChange}
              label="Circuit File"
              placeholder="Search circuit files..."
            />
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {scenarioSelectorContent}
          
          <FileMenuLeftHeader
            circuitJson={circuitJson}
            isWebEmbedded={false}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <CircuitJsonPreview
          circuitJson={circuitJson}
          defaultActiveTab={activeTab}
          onActiveTabChange={setActiveTab}
          defaultToFullScreen={defaultToFullScreen}
          showToggleFullScreen={showToggleFullScreen}
          showSchematicDebugGrid={debug}
        />
      </div>
    </div>
  )
}
