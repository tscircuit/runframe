import { useEffect, useMemo } from "react"
import type { CircuitJson } from "circuit-json"

export interface CircuitJsonFileError {
  error: string
  stack: string
}

export interface UseCircuitJsonFileOptions {
  mainComponentPath?: string
  fsMap: Map<string, string>
  isLoadingFiles?: boolean
  onCircuitJsonChange?: (circuitJson: CircuitJson) => void
  setCircuitJson: (circuitJson: CircuitJson) => void
  setError: (error: CircuitJsonFileError | null) => void
}

/**
 * Hook to handle circuit.json file detection, parsing, and syncing.
 * Handles all side effects internally - the caller just needs to pass callbacks.
 * Returns isCircuitJsonFile so the caller can skip worker execution when true.
 */
export const useCircuitJsonFile = ({
  mainComponentPath,
  fsMap,
  isLoadingFiles,
  onCircuitJsonChange,
  setCircuitJson,
  setError,
}: UseCircuitJsonFileOptions): { isCircuitJsonFile: boolean } => {
  const isCircuitJsonFile = useMemo(() => {
    return (
      mainComponentPath?.endsWith(".circuit.json") ||
      mainComponentPath?.toLowerCase() === "circuit.json"
    )
  }, [mainComponentPath])

  useEffect(() => {
    if (!isCircuitJsonFile || isLoadingFiles) return

    const circuitJsonContent = fsMap.get(mainComponentPath!)
    if (!circuitJsonContent) {
      setError({
        error: `Circuit JSON file not found: ${mainComponentPath}`,
        stack: "",
      })
      return
    }

    try {
      const parsed = JSON.parse(circuitJsonContent) as CircuitJson
      setCircuitJson(parsed)
      setError(null)
      onCircuitJsonChange?.(parsed)
    } catch (e) {
      setError({
        error: `Failed to parse circuit.json: ${e instanceof Error ? e.message : String(e)}`,
        stack: "",
      })
    }
  }, [
    isCircuitJsonFile,
    mainComponentPath,
    fsMap,
    isLoadingFiles,
    onCircuitJsonChange,
    setCircuitJson,
    setError,
  ])

  return { isCircuitJsonFile }
}
