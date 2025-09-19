import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { CircuitJsonPreview } from "../CircuitJsonPreview/CircuitJsonPreview"
import { FileMenuLeftHeader } from "../FileMenuLeftHeader"
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

  useEffect(() => {
    const loadCircuitJson = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`${props.buildDirectoryUrl}/circuit.json`)
        
        if (!response.ok) {
          throw new Error(`Failed to load circuit.json: ${response.statusText}`)
        }
        
        const json = await response.json()
        
        if (!Array.isArray(json)) {
          throw new Error("Invalid circuit JSON: expected an array")
        }
        
        setCircuitJson(json)
        props.onCircuitJsonLoaded?.(json)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
        setError(errorMessage)
        console.error("Failed to load circuit JSON:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadCircuitJson()
  }, [props.buildDirectoryUrl, props.onCircuitJsonLoaded])

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
                Build directory: {props.buildDirectoryUrl}
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
          <FileMenuLeftHeader
            isWebEmbedded={true}
            circuitJson={circuitJson}
          />
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
