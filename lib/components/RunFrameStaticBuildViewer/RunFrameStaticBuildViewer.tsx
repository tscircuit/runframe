import { useCallback, useEffect, useState } from "react"
import { CircuitJsonPreview } from "../CircuitJsonPreview/CircuitJsonPreview"
import { CircuitJsonFileSelectorCombobox } from "./CircuitJsonFileSelectorCombobox"
import { LoadingSkeleton } from "../ui/LoadingSkeleton"
import { useStyles } from "../../hooks/use-styles"
import type { CircuitJson } from "circuit-json"
import { FileMenuLeftHeader } from "../FileMenuLeftHeader"
import { guessEntrypoint } from "lib/runner"

export interface RunFrameStaticBuildViewerProps {
  debug?: boolean
  circuitJsonFiles?: Record<string, CircuitJson>
  initialCircuitPath?: string
  onCircuitJsonPathChange?: (path: string) => void
  defaultToFullScreen?: boolean
  showToggleFullScreen?: boolean
  projectName?: string
  showFileMenu?: boolean
}

export const RunFrameStaticBuildViewer = (
  props: RunFrameStaticBuildViewerProps,
) => {
  useStyles()

  const [currentCircuitJsonPath, setCurrentCircuitJsonPath] = useState<string>(
    () => {
      return props.initialCircuitPath ?? ""
    },
  )

  const [circuitJson, setCircuitJson] = useState<CircuitJson | null>(null)
  const [isLoadingFiles, setIsLoadingFiles] = useState(true)

  const circuitJsonFiles = props.circuitJsonFiles ?? {}
  const availableFiles = Object.keys(circuitJsonFiles)

  useEffect(() => {
    setIsLoadingFiles(true)

    if (availableFiles.length === 0) {
      setIsLoadingFiles(false)
      return
    }

    let selectedPath = currentCircuitJsonPath

    if (!selectedPath || !circuitJsonFiles[selectedPath]) {
      // Prioritize index files first, then main files
      selectedPath = guessEntrypoint(availableFiles) ?? availableFiles[0]
      setCurrentCircuitJsonPath(selectedPath)
    }

    if (selectedPath && circuitJsonFiles[selectedPath]) {
      setCircuitJson(circuitJsonFiles[selectedPath])
      props.onCircuitJsonPathChange?.(selectedPath)
    }

    setIsLoadingFiles(false)
  }, [
    circuitJsonFiles,
    currentCircuitJsonPath,
    availableFiles,
    props.onCircuitJsonPathChange,
  ])

  const handleFileChange = useCallback(
    (newPath: string) => {
      setCurrentCircuitJsonPath(newPath)
      if (circuitJsonFiles[newPath]) {
        setCircuitJson(circuitJsonFiles[newPath])
        props.onCircuitJsonPathChange?.(newPath)
      }
    },
    [circuitJsonFiles, props.onCircuitJsonPathChange],
  )

  if (isLoadingFiles) {
    return <LoadingSkeleton message="Loading circuit files..." />
  }

  if (availableFiles.length === 0) {
    return (
      <div className="rf-flex rf-flex-col rf-w-full rf-h-full rf-items-center rf-justify-center">
        <div className="rf-text-center rf-p-8">
          <h3 className="rf-text-lg rf-font-semibold rf-text-gray-800 rf-mb-2">
            No Circuit JSON Files Found
          </h3>
          <p className="rf-text-sm rf-text-gray-600">
            Please provide circuit JSON files to view.
          </p>
        </div>
      </div>
    )
  }

  return (
    <CircuitJsonPreview
      circuitJson={circuitJson}
      defaultToFullScreen={props.defaultToFullScreen}
      showToggleFullScreen={props.showToggleFullScreen}
      showFileMenu={false}
      isWebEmbedded={false}
      projectName={props.projectName}
      leftHeaderContent={
        <div className="rf-flex rf-items-center rf-justify-between rf-w-full">
          {(props.showFileMenu ?? true) && (
            <FileMenuLeftHeader
              isWebEmbedded={false}
              circuitJson={circuitJson}
              projectName={props.projectName}
            />
          )}
          {availableFiles.length > 1 && (
            <div className="rf-absolute rf-left-1/2 rf-transform rf--translate-x-1/2">
              <CircuitJsonFileSelectorCombobox
                currentFile={currentCircuitJsonPath}
                files={availableFiles}
                onFileChange={handleFileChange}
              />
            </div>
          )}
        </div>
      }
    />
  )
}
