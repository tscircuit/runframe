import type { CircuitJson } from "circuit-json"

/**
 * Configuration for circuit JSON file loading
 */
export interface CircuitJsonFileLoaderConfig {
  /** Base URL or directory path where circuit JSON files are located */
  baseUrl?: string
  /** Default filename to load if not specified */
  defaultFilename?: string
  /** Whether to fetch files asynchronously from a URL */
  isAsync?: boolean
  /** Headers to include in fetch requests */
  headers?: Record<string, string>
}

/**
 * Result of loading circuit JSON files
 */
export interface CircuitJsonLoadResult {
  /** Loaded circuit JSON data */
  circuitJson: CircuitJson | null
  /** List of available files */
  availableFiles: string[]
  /** Currently selected file */
  selectedFile: string
  /** Loading state */
  isLoading: boolean
  /** Error message if any */
  error: string | null
}

/**
 * Loads circuit JSON files from various sources
 * 
 * @param config Configuration for loading files
 * @param files Record of filename to CircuitJson data (for static loading)
 * @returns Promise resolving to CircuitJsonLoadResult
 */
export async function circuitJsonFileLoader(
  config: CircuitJsonFileLoaderConfig = {},
  files?: Record<string, CircuitJson>
): Promise<CircuitJsonLoadResult> {
  const {
    baseUrl = "",
    defaultFilename = "circuit.json",
    isAsync = false,
    headers = {}
  } = config

  try {
    // Determine available files
    let availableFiles: string[] = []
    
    if (isAsync && baseUrl) {
      // For async loading, we'd typically fetch a directory listing
      // For now, we'll assume the files are known or provided
      availableFiles = [defaultFilename]
    } else if (files) {
      // For static loading, use the provided files
      availableFiles = Object.keys(files)
    } else {
      throw new Error("No files provided and async loading not configured")
    }

    if (availableFiles.length === 0) {
      throw new Error("No circuit JSON files available")
    }

    // Determine which file to load
    const selectedFile = availableFiles.includes(defaultFilename) 
      ? defaultFilename 
      : availableFiles[0]

    let circuitJson: CircuitJson | null = null

    if (isAsync && baseUrl) {
      // Async loading from URL
      const fileUrl = `${baseUrl}/${selectedFile}`
      const response = await fetch(fileUrl, { headers })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${fileUrl}: ${response.statusText}`)
      }
      
      circuitJson = await response.json()
    } else if (files) {
      // Static loading from provided files
      circuitJson = files[selectedFile] || null
    }

    return {
      circuitJson,
      availableFiles,
      selectedFile,
      isLoading: false,
      error: null
    }
  } catch (error) {
    return {
      circuitJson: null,
      availableFiles: Object.keys(files || {}),
      selectedFile: defaultFilename,
      isLoading: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

/**
 * Auto-loads circuit JSON files with smart defaults and error handling
 * 
 * This utility provides a convenient way to load circuit JSON files from various sources
 * with proper error handling and state management. It supports both static (in-memory)
 * and async (URL-based) loading patterns.
 * 
 * @example
 * // Static loading
 * const result = await autoLoadCircuitJsonFiles({
 *   files: {
 *     "circuit.json": circuitData1,
 *     "board.json": circuitData2
 *   },
 *   defaultFilename: "circuit.json"
 * })
 * 
 * @example
 * // Async loading
 * const result = await autoLoadCircuitJsonFiles({
 *   baseUrl: "https://example.com/circuits",
 *   defaultFilename: "main.json",
 *   isAsync: true
 * })
 * 
 * @param config Configuration for loading files
 * @param files Optional record of filename to CircuitJson data for static loading
 * @returns Promise resolving to CircuitJsonLoadResult
 */
export async function autoLoadCircuitJsonFiles(
  config: CircuitJsonFileLoaderConfig & { files?: Record<string, CircuitJson> } = {}
): Promise<CircuitJsonLoadResult> {
  const { files, ...loaderConfig } = config
  return circuitJsonFileLoader(loaderConfig, files)
}

/**
 * Synchronous version for static file loading
 * 
 * @param files Record of filename to CircuitJson data
 * @param defaultFilename Default filename to select
 * @returns CircuitJsonLoadResult
 */
export function loadCircuitJsonFilesSync(
  files: Record<string, CircuitJson>,
  defaultFilename: string = "circuit.json"
): CircuitJsonLoadResult {
  try {
    const availableFiles = Object.keys(files)
    
    if (availableFiles.length === 0) {
      throw new Error("No circuit JSON files provided")
    }

    const selectedFile = availableFiles.includes(defaultFilename) 
      ? defaultFilename 
      : availableFiles[0]

    const circuitJson = files[selectedFile] || null

    return {
      circuitJson,
      availableFiles,
      selectedFile,
      isLoading: false,
      error: null
    }
  } catch (error) {
    return {
      circuitJson: null,
      availableFiles: Object.keys(files),
      selectedFile: defaultFilename,
      isLoading: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}
