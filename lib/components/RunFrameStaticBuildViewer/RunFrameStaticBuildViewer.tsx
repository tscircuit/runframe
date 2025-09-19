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

/**
 * A production-ready static viewer for circuit JSON files.
 * 
 * This component provides a clean, reusable interface for viewing circuit JSON files
 * with support for multiple file selection, export functionality, and customizable
 * UI elements. It follows the established patterns in the runframe codebase.
 * 
 * @example
 * ```tsx
 * <RunFrameStaticBuildViewer
 *   circuitJsonFiles={{
 *     "circuit.json": circuitData1,
 *     "board.json": circuitData2
 *   }}
 *   defaultFilename="circuit.json"
 *   onFileChange={(filename, circuitJson) => console.log(`Loaded ${filename}`)}
 * />
 * ```
 */
export const RunFrameStaticBuildViewer = (props: RunFrameStaticBuildViewerProps) => {
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

  // State management
  const [circuitJson, setCircuitJson] = useState<CircuitJson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>(defaultActiveTab)
  const [selectedFile, setSelectedFile] = useState<string>(defaultFilename)
  const [availableFiles, setAvailableFiles] = useState<string[]>([])

  // Load initial circuit JSON
  useEffect(() => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Use the synchronous loader for static files
      const result = loadCircuitJsonFilesSync(circuitJsonFiles, defaultFilename)
      
      setCircuitJson(result.circuitJson)
      setSelectedFile(result.selectedFile)
      setAvailableFiles(result.availableFiles)
      setError(result.error)
      
      // Trigger callback if circuit JSON was loaded successfully
      if (result.circuitJson && !result.error) {
        onCircuitJsonLoaded?.(result.circuitJson, result.selectedFile)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load circuit files")
    } finally {
      setIsLoading(false)
    }
  }, [circuitJsonFiles, defaultFilename, onCircuitJsonLoaded])

  // Handle file selection changes
  const handleFileChange = useCallback((filename: string) => {
    const newCircuitJson = circuitJsonFiles[filename]
    
    setSelectedFile(filename)
    setCircuitJson(newCircuitJson)
    
    // Trigger callbacks
    onFileChange?.(filename, newCircuitJson)
    onCircuitJsonLoaded?.(newCircuitJson, filename)
  }, [circuitJsonFiles, onFileChange, onCircuitJsonLoaded])

  // Handle export actions
  const handleExport = useCallback((format: string, filename: string) => {
    onExport?.(format, filename)
  }, [onExport])

  // Loading state
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

  // Error state
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

  // No circuit data
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

  // Main component render
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header Section */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          {/* File Menu */}
          {showFileMenu && (
            <StaticBuildFileMenu
              circuitJson={circuitJson}
              currentFile={selectedFile}
              onExport={handleExport}
              exportFormats={exportFormats}
            />
          )}
          
          {/* File Selector */}
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
        
        {/* Right side content */}
        <div className="flex items-center gap-4">
          {/* Scenario Selector Content */}
          {scenarioSelectorContent}
          
          {/* File Menu Header (for additional functionality) */}
          <FileMenuLeftHeader
            circuitJson={circuitJson}
            isWebEmbedded={false}
          />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <CircuitJsonPreview
          circuitJson={circuitJson}
          debug={debug}
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          defaultToFullScreen={defaultToFullScreen}
          showToggleFullScreen={showToggleFullScreen}
        />
      </div>
    </div>
  )
}
