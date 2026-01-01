import { useMemo } from "react"
import type { CircuitJson } from "circuit-json"

export interface UseCircuitJsonFileOptions {
  mainComponentPath?: string
  fsMap: Map<string, string>
}

export interface UseCircuitJsonFileResult {
  isCircuitJsonFile: boolean
  data: CircuitJson | null
  error: string | null
}

/**
 * Hook to detect and parse circuit.json files.
 * Returns the parsed data synchronously.
 */
export const useCircuitJsonFile = ({
  mainComponentPath,
  fsMap,
}: UseCircuitJsonFileOptions): UseCircuitJsonFileResult => {
  return useMemo(() => {
    const isCircuitJsonFile =
      mainComponentPath?.endsWith(".circuit.json") ||
      mainComponentPath?.toLowerCase() === "circuit.json"

    if (!isCircuitJsonFile) {
      return { isCircuitJsonFile: false, data: null, error: null }
    }

    const circuitJsonContent = fsMap.get(mainComponentPath!)
    if (!circuitJsonContent) {
      return {
        isCircuitJsonFile: true,
        data: null,
        error: `Circuit JSON file not found: ${mainComponentPath}`,
      }
    }

    try {
      const parsed = JSON.parse(circuitJsonContent) as CircuitJson
      return { isCircuitJsonFile: true, data: parsed, error: null }
    } catch (e) {
      return {
        isCircuitJsonFile: true,
        data: null,
        error: `Failed to parse circuit.json: ${e instanceof Error ? e.message : String(e)}`,
      }
    }
  }, [mainComponentPath, fsMap])
}
