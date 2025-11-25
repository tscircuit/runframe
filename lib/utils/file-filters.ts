/**
 * File filter utilities for board file selection
 *
 * Used across the UI to maintain consistent file filtering behavior
 */

export const getUiFileFilter = () => (filename: string) => {
  return (
    filename.endsWith(".tsx") ||
    filename.endsWith(".circuit.json") ||
    filename.endsWith(".jsx")
  )
}

/**
 * Default UI file filter instance
 * Prefer using getUiFileFilter() for consistency
 */
export const DEFAULT_UI_FILE_FILTER = getUiFileFilter()
