import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { CircuitJsonPreview } from "../CircuitJsonPreview/CircuitJsonPreview"
import { FileMenuLeftHeader } from "../FileMenuLeftHeader"
import { EnhancedFileSelectorCombobox } from "../RunFrameWithApi/EnhancedFileSelectorCombobox/EnhancedFileSelectorCombobox"
import { cn } from "lib/utils"
import type { RunFrameStaticBuildViewerProps } from "./RunFrameStaticBuildViewerProps"
import type { CircuitJson } from "circuit-json"
import type { TabId } from "../CircuitJsonPreview/PreviewContentProps"

export const RunFrameStaticBuildViewer = (props: RunFrameStaticBuildViewerProps) => {
  const [circuitJson, setCircuitJson] = useState<CircuitJson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>(
    props.defaultActiveTab ?? "pcb"
  )
  const [selectedFile, setSelectedFile] = useState<string>(
    props.defaultFilename ?? "circuit.json"
  )
  const [availableFiles, setAvailableFiles] = useState<string[]>([])

  useEffect(() => {
    const loadInitialCircuitJson = () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Extract available files from the circuitJsonFsMap
        const files = Array.from(props.circuitJsonFsMap.keys())
        setAvailableFiles(files)
        
        // Determine the initial file to load
        const initialFile = props.defaultFilename ?? "circuit.json"
        const fileToLoad = files.includes(initialFile) ? initialFile : files[0]
        
        if (!fileToLoad) {
          throw new Error("No circuit JSON files available")
        }
        
        setSelectedFile(fileToLoad)
        const json = props.circuitJsonFsMap.get(fileToLoad)
        
        if (!json) {
          throw new Error(`Circuit JSON not found for file: ${fileToLoad}`)
        }
        
        if (!Array.isArray(json)) {
          throw new Error(`Invalid circuit JSON in file ${fileToLoad}: expected an array`)
        }
        
        setCircuitJson(json)
        props.onCircuitJsonLoaded?.(json, fileToLoad)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
        setError(errorMessage)
        console.error("Failed to load circuit JSON:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialCircuitJson()
  }, [props.circuitJsonFsMap, props.defaultFilename, props.onCircuitJsonLoaded])

  const handleFileChange = useCallback((filename: string) => {
    try {
      const json = props.circuitJsonFsMap.get(filename)
      
      if (!json) {
        throw new Error(`Circuit JSON not found for file: ${filename}`)
      }
      
      if (!Array.isArray(json)) {
        throw new Error(`Invalid circuit JSON in file ${filename}: expected an array`)
      }
      
      setSelectedFile(filename)
      setCircuitJson(json)
      props.onFileChange?.(filename, json)
      props.onCircuitJsonLoaded?.(json, filename)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      console.error(`Failed to load circuit JSON from file ${filename}:`, err)
    }
  }, [props.circuitJsonFsMap, props.onFileChange, props.onCircuitJsonLoaded])

  const handleActiveTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab)
  }, [])

  if (isLoading) {
    return (
      <div className="rf-flex rf-flex-col rf-w-full rf-h-full">
        <div className="rf-flex rf-items-center rf-gap-4 rf-p-2 rf-border-b">
          <div className="rf-w-20 rf-h-9 rf-bg-gray-200 dark:rf-bg-gray-700 rf-rounded-md rf-animate-pulse" />
          <div className="rf-flex rf-gap-6 rf-ml-auto">
            {["PCB", "Schematic", "3D"].map((_, i) => (
              <div
                key={i}
                className="rf-h-6 rf-w-20 rf-bg-gray-200 dark:rf-bg-gray-700 rf-rounded rf-animate-pulse"
              />
            ))}
          </div>
        </div>
        <div className="rf-flex-1 rf-p-4">
          <div className="rf-w-full rf-h-full rf-rounded-lg rf-bg-gray-100 dark:rf-bg-gray-800 rf-animate-pulse rf-flex rf-items-center rf-justify-center">
            <div className="rf-flex rf-flex-col rf-items-center rf-gap-4">
              <Loader2 className="rf-w-8 rf-h-8 rf-animate-spin rf-text-gray-400" />
              <div className="rf-text-sm rf-text-gray-400 dark:rf-text-gray-500">
                Loading prebuilt circuit...
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rf-flex rf-flex-col rf-w-full rf-h-full">
        <div className="rf-flex rf-items-center rf-gap-4 rf-p-2 rf-border-b">
          <div className="rf-text-sm rf-font-medium rf-text-red-600">
            Error Loading Circuit
          </div>
        </div>
        <div className="rf-flex-1 rf-p-4">
          <div className="rf-w-full rf-h-full rf-rounded-lg rf-bg-red-50 dark:rf-bg-red-900/20 rf-flex rf-items-center rf-justify-center">
            <div className="rf-flex rf-flex-col rf-items-center rf-gap-4 rf-text-center">
              <div className="rf-text-lg rf-font-medium rf-text-red-800 dark:rf-text-red-200">
                Failed to load circuit data
              </div>
              <div className="rf-text-sm rf-text-red-600 dark:rf-text-red-300 max-w-md">
                {error}
              </div>
              <div className="rf-text-xs rf-text-red-500 dark:rf-text-red-400">
                Available files: {availableFiles.join(", ") || "None"}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <CircuitJsonPreview
      circuitJson={circuitJson}
      defaultActiveTab={props.defaultActiveTab}
      defaultToFullScreen={props.defaultToFullScreen}
      showToggleFullScreen={props.showToggleFullScreen}
      leftHeaderContent={
        <div className="rf-flex rf-items-center rf-justify-between rf-w-full">
          <div className="rf-flex rf-items-center rf-gap-4">
            <FileMenuLeftHeader
              isWebEmbedded={true}
              circuitJson={circuitJson}
            />
            {availableFiles.length > 1 && (
              <div className="rf-flex rf-items-center rf-gap-2">
                <span className="rf-text-sm rf-text-gray-600 dark:rf-text-gray-400">
                  File:
                </span>
                <EnhancedFileSelectorCombobox
                  files={availableFiles}
                  currentFile={selectedFile}
                  onFileChange={handleFileChange}
                />
              </div>
            )}
          </div>
          {props.scenarioSelectorContent}
        </div>
      }
      onActiveTabChange={handleActiveTabChange}
      showFileMenu={false}
      showRightHeaderContent={true}
      showCodeTab={false}
      showJsonTab={true}
      showRenderLogTab={false}
      readOnly={true}
      isRunningCode={false}
      hasCodeChangedSinceLastRun={false}
      availableTabs={["pcb", "schematic", "cad", "assembly", "pinout", "bom", "circuit_json"]}
      className={cn(
        "rf-h-full",
        props.defaultToFullScreen && "rf-fixed rf-top-0 rf-left-0 rf-w-full rf-h-full rf-bg-white rf-overflow-hidden"
      )}
    />
  )
}
