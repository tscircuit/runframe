import { useMemo } from "react"
import type { CircuitJson } from "circuit-json"

export interface UseCircuitJsonFileOptions {
  mainComponentPath?: string
  fsMap: Map<string, string>
}

export interface UseCircuitJsonFileResult {
  isStaticCircuitJson: boolean
  circuitJson: CircuitJson | null
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
    const isStaticCircuitJson =
      mainComponentPath?.endsWith(".circuit.json") ||
      mainComponentPath?.toLowerCase() === "circuit.json"

    if (!isStaticCircuitJson) {
      return { isStaticCircuitJson: false, circuitJson: null, error: null }
    }

    const circuitJsonContent = fsMap.get(mainComponentPath!)
    if (!circuitJsonContent) {
      return {
        isStaticCircuitJson: true,
        circuitJson: null,
        error: `Circuit JSON file not found: ${mainComponentPath}`,
      }
    }

    try {
      const parsed = JSON.parse(circuitJsonContent) as CircuitJson
      return { isStaticCircuitJson: true, circuitJson: parsed, error: null }
    } catch (e) {
      return {
        isStaticCircuitJson: true,
        circuitJson: null,
        error: `Failed to parse circuit.json: ${e instanceof Error ? e.message : String(e)}`,
      }
    }
  }, [mainComponentPath, fsMap])
}
