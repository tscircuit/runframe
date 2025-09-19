import type { CircuitJson } from "circuit-json"

export interface CircuitJsonFileLoaderConfig {
  baseUrl?: string
  defaultFilename?: string
  isAsync?: boolean
  headers?: Record<string, string>
}

export interface CircuitJsonLoadResult {
  circuitJson: CircuitJson | null
  availableFiles: string[]
  selectedFile: string
  isLoading: boolean
  error: string | null
}

export async function circuitJsonFileLoader(
  config: CircuitJsonFileLoaderConfig = {},
  files?: Record<string, CircuitJson>,
): Promise<CircuitJsonLoadResult> {
  const {
    baseUrl = "",
    defaultFilename = "circuit.json",
    isAsync = false,
    headers = {},
  } = config

  try {
    let availableFiles: string[] = []

    if (isAsync && baseUrl) {
      availableFiles = [defaultFilename]
    } else if (files) {
      availableFiles = Object.keys(files)
    } else {
      throw new Error("No files provided and async loading not configured")
    }

    if (availableFiles.length === 0) {
      throw new Error("No circuit JSON files available")
    }

    const selectedFile = availableFiles.includes(defaultFilename)
      ? defaultFilename
      : availableFiles[0]

    let circuitJson: CircuitJson | null = null

    if (isAsync && baseUrl) {
      const fileUrl = `${baseUrl}/${selectedFile}`
      const response = await fetch(fileUrl, { headers })

      if (!response.ok) {
        throw new Error(`Failed to fetch ${fileUrl}: ${response.statusText}`)
      }

      circuitJson = await response.json()
    } else if (files) {
      circuitJson = files[selectedFile] || null
    }

    return {
      circuitJson,
      availableFiles,
      selectedFile,
      isLoading: false,
      error: null,
    }
  } catch (error) {
    return {
      circuitJson: null,
      availableFiles: Object.keys(files || {}),
      selectedFile: defaultFilename,
      isLoading: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function autoLoadCircuitJsonFiles(
  config: CircuitJsonFileLoaderConfig & {
    files?: Record<string, CircuitJson>
  } = {},
): Promise<CircuitJsonLoadResult> {
  const { files, ...loaderConfig } = config
  return circuitJsonFileLoader(loaderConfig, files)
}

export function loadCircuitJsonFilesSync(
  files: Record<string, CircuitJson>,
  defaultFilename: string = "circuit.json",
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
      error: null,
    }
  } catch (error) {
    return {
      circuitJson: null,
      availableFiles: Object.keys(files),
      selectedFile: defaultFilename,
      isLoading: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
