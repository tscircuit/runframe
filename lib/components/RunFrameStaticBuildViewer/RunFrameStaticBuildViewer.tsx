import { useCallback, useEffect, useState } from "react"
import { CircuitJsonPreview } from "../CircuitJsonPreview/CircuitJsonPreview"
import { CircuitJsonFileSelectorCombobox } from "./CircuitJsonFileSelectorCombobox"
import { useStyles } from "../../hooks/use-styles"
import type { CircuitJson } from "circuit-json"
import { FileMenuLeftHeader } from "../FileMenuLeftHeader"
import { guessEntrypoint } from "lib/runner"
import { ErrorBoundary } from "react-error-boundary"

export interface CircuitJsonFileReference {
  filePath: string
  fileStaticAssetUrl: string
}

export interface RunFrameStaticBuildViewerProps {
  debug?: boolean
  files: CircuitJsonFileReference[]
  onFetchFile?: (fileRef: CircuitJsonFileReference) => Promise<CircuitJson>
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
  const [isLoadingCurrentFile, setIsLoadingCurrentFile] = useState(false)
  const [fileCache, setFileCache] = useState<Record<string, CircuitJson>>({})
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set())
  const [failedFiles, setFailedFiles] = useState<Set<string>>(new Set())

  const fileReferences = props.files
  const availableFiles = fileReferences.map((f) => f.filePath)

  const defaultFetchFile = useCallback(
    async (fileRef: CircuitJsonFileReference): Promise<CircuitJson> => {
      if (!fileRef.fileStaticAssetUrl) {
        throw new Error(
          `No fileStaticAssetUrl provided for ${fileRef.filePath}`,
        )
      }

      const response = await fetch(fileRef.fileStaticAssetUrl)
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${fileRef.filePath}: ${response.statusText}`,
        )
      }

      return await response.json()
    },
    [],
  )

  const loadCircuitJsonFile = useCallback(
    async (filePath: string) => {
      if (fileCache[filePath]) {
        setCircuitJson(fileCache[filePath])
        props.onCircuitJsonPathChange?.(filePath)
        return
      }

      if (failedFiles.has(filePath)) {
        console.warn(`Skipping failed file: ${filePath}`)
        setCircuitJson(null)
        return
      }

      if (loadingFiles.has(filePath)) {
        return
      }

      setLoadingFiles((prev) => new Set(prev).add(filePath))
      setIsLoadingCurrentFile(true)
      setCircuitJson(null)

      try {
        const fileRef = fileReferences.find((f) => f.filePath === filePath)
        if (!fileRef) {
          throw new Error(`File reference not found for ${filePath}`)
        }

        const fetchFn = props.onFetchFile || defaultFetchFile
        const circuitJsonData = await fetchFn(fileRef)

        setFileCache((prev) => ({ ...prev, [filePath]: circuitJsonData }))
        setCircuitJson(circuitJsonData)
        props.onCircuitJsonPathChange?.(filePath)

        setFailedFiles((prev) => {
          const newSet = new Set(prev)
          newSet.delete(filePath)
          return newSet
        })
      } catch (error) {
        console.error(`Failed to load circuit JSON file ${filePath}:`, error)
        setFailedFiles((prev) => new Set(prev).add(filePath))
        setCircuitJson(null)
      } finally {
        setLoadingFiles((prev) => {
          const newSet = new Set(prev)
          newSet.delete(filePath)
          return newSet
        })
        setIsLoadingCurrentFile(false)
      }
    },
    [
      fileReferences,
      fileCache,
      loadingFiles,
      failedFiles,
      props.onFetchFile,
      props.onCircuitJsonPathChange,
      defaultFetchFile,
    ],
  )

  useEffect(() => {
    if (availableFiles.length === 0) return

    let selectedPath = currentCircuitJsonPath

    if (!selectedPath || !availableFiles.includes(selectedPath)) {
      selectedPath = guessEntrypoint(availableFiles) ?? availableFiles[0]
      setCurrentCircuitJsonPath(selectedPath)
    }

    if (selectedPath && availableFiles.includes(selectedPath)) {
      loadCircuitJsonFile(selectedPath)
    }
  }, [availableFiles, currentCircuitJsonPath])

  const handleFileChange = useCallback((newPath: string) => {
    setCurrentCircuitJsonPath(newPath)
  }, [])

  const retryFailedFile = useCallback(
    (filePath: string) => {
      setFailedFiles((prev) => {
        const newSet = new Set(prev)
        newSet.delete(filePath)
        return newSet
      })
      loadCircuitJsonFile(filePath)
    },
    [loadCircuitJsonFile],
  )

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

  const currentFileFailed = failedFiles.has(currentCircuitJsonPath)

  return (
    <ErrorBoundary
      fallbackRender={({ error }: { error: Error }) => (
        <div className="rf-mt-4 rf-mx-4 rf-bg-red-50 rf-rounded-md rf-border rf-border-red-200">
          <div className="rf-p-4">
            <h3 className="rf-text-lg rf-font-semibold rf-text-red-800 rf-mb-3">
              Error loading Circuit JSON Preview
            </h3>
            <p className="rf-text-xs rf-font-mono rf-whitespace-pre-wrap rf-text-red-600 rf-mt-2">
              {error.message}
            </p>
          </div>
        </div>
      )}
    >
      {currentFileFailed ? (
        <div className="rf-w-full rf-h-full rf-flex rf-flex-col">
          <div className="rf-flex rf-items-center rf-justify-between rf-w-full rf-p-4 rf-border-b rf-border-gray-200">
            {(props.showFileMenu ?? true) && (
              <FileMenuLeftHeader
                isWebEmbedded={false}
                circuitJson={null}
                projectName={props.projectName}
              />
            )}
            {availableFiles.length > 1 && (
              <div className="rf-absolute rf-left-1/2 rf-transform rf--translate-x-1/2 rf-flex rf-items-center rf-gap-2">
                <CircuitJsonFileSelectorCombobox
                  currentFile={currentCircuitJsonPath}
                  files={availableFiles}
                  onFileChange={handleFileChange}
                />
              </div>
            )}
          </div>
          <div className="rf-flex-1 rf-flex rf-items-center rf-justify-center">
            <div className="rf-text-center rf-p-8">
              <h3 className="rf-text-lg rf-font-semibold rf-text-red-600 rf-mb-2">
                Failed to Load Circuit File
              </h3>
              <p className="rf-text-sm rf-text-gray-600 rf-mb-4">
                Could not load: {currentCircuitJsonPath}
              </p>
              <div className="rf-flex rf-flex-col rf-items-center rf-gap-2">
                <button
                  onClick={() => retryFailedFile(currentCircuitJsonPath)}
                  className="rf-px-4 rf-py-2 rf-bg-blue-500 rf-text-white rf-rounded rf-hover:bg-blue-600"
                >
                  Retry
                </button>
                {availableFiles.length > 1 && (
                  <p className="rf-text-xs rf-text-gray-500">
                    Or select a different file from the dropdown above
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
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
                <div
                  className={`rf-absolute rf-left-1/2 rf-transform rf--translate-x-1/2 rf-flex rf-items-center rf-gap-2 ${isLoadingCurrentFile ? "rf-opacity-50" : ""}`}
                >
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
      )}
    </ErrorBoundary>
  )
}
