import type { ReactNode } from "react"

/**
 * Props for the CircuitJsonFileSelector component
 */
export interface CircuitJsonFileSelectorProps {
  /** Array of available circuit JSON files */
  files: string[]
  /** Currently selected file */
  selectedFile: string
  /** Callback when file selection changes */
  onFileChange: (filename: string) => void
  /** Optional placeholder text for the search input */
  placeholder?: string
  /** Optional label for the selector */
  label?: string
  /** Optional className for styling */
  className?: string
  /** Optional disabled state */
  disabled?: boolean
  /** Optional custom content to display before the selector */
  prefixContent?: ReactNode
  /** Optional custom content to display after the selector */
  suffixContent?: ReactNode
  /** Whether to show the selector when only one file is available */
  showWhenSingleFile?: boolean
}
