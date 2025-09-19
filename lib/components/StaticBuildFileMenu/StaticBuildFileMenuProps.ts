import type { ReactNode } from "react"
import type { CircuitJson } from "circuit-json"

/**
 * Props for the StaticBuildFileMenu component
 */
export interface StaticBuildFileMenuProps {
  /** Current circuit JSON data */
  circuitJson?: CircuitJson
  /** Currently selected filename */
  currentFile?: string
  /** Whether the menu is disabled */
  disabled?: boolean
  /** Optional custom content to display in the menu */
  customMenuItems?: ReactNode
  /** Callback when export is triggered */
  onExport?: (format: string, filename: string) => void
  /** Callback when custom menu item is clicked */
  onCustomAction?: (action: string) => void
  /** Available export formats */
  exportFormats?: string[]
  /** Whether to show export functionality */
  showExport?: boolean
  /** Optional className for styling */
  className?: string
}
