import type { CircuitJson } from "circuit-json"
import { isCircuitJsonFile } from "lib/utils/file-filters"
import { useMemo } from "react"

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
      mainComponentPath != null && isCircuitJsonFile(mainComponentPath)

    if (!isStaticCircuitJson) {
      return { isStaticCircuitJson: false, circuitJson: null, error: null }
    }

    const circuitJsonContent = fsMap.get(mainComponentPath!)
    if (circuitJsonContent === undefined) {
      return {
        isStaticCircuitJson: true,
        circuitJson: null,
        error: `Circuit JSON file not found: ${mainComponentPath}`,
      }
    }

    try {
      const parsed: unknown = JSON.parse(circuitJsonContent)
      if (!Array.isArray(parsed)) {
        throw new Error("Expected an array of circuit elements")
      }
      for (const [index, element] of parsed.entries()) {
        if (
          element === null ||
          typeof element !== "object" ||
          Array.isArray(element) ||
          typeof element.type !== "string"
        ) {
          throw new Error(`Invalid circuit element at index ${index}`)
        }
      }
      return {
        isStaticCircuitJson: true,
        circuitJson: parsed as CircuitJson,
        error: null,
      }
    } catch (e) {
      return {
        isStaticCircuitJson: true,
        circuitJson: null,
        error: `Failed to parse circuit.json: ${e instanceof Error ? e.message : String(e)}`,
      }
    }
  }, [mainComponentPath, fsMap])
}
