import type { ReactNode } from "react"
import type { CircuitJson } from "circuit-json"

export interface StaticBuildFileMenuProps {
  circuitJson?: CircuitJson
  currentFile?: string
  disabled?: boolean
  customMenuItems?: ReactNode
  onExport?: (format: string, filename: string) => void
  onCustomAction?: (action: string) => void
  exportFormats?: string[]
  showExport?: boolean
  className?: string
}
