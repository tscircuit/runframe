/**
 * File filter utilities for board file selection
 *
 * Used across the UI to maintain consistent file filtering behavior
 */

export const isCircuitJsonFile = (filename: string) => {
  const normalizedFilename = filename.toLowerCase()
  const basename = normalizedFilename.split("/").pop()

  return (
    normalizedFilename.endsWith(".circuit.json") || basename === "circuit.json"
  )
}

export const getUiFileFilter = () => (filename: string) => {
  return (
    filename.endsWith(".tsx") ||
    isCircuitJsonFile(filename) ||
    filename.endsWith(".jsx")
  )
}

/**
 * Default UI file filter instance
 * Prefer using getUiFileFilter() for consistency
 */
export const DEFAULT_UI_FILE_FILTER = getUiFileFilter()
