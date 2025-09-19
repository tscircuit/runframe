import type { ReactNode } from "react"

export interface CircuitJsonFileSelectorProps {
  files: string[]
  selectedFile: string
  onFileChange: (filename: string) => void
  placeholder?: string
  label?: string
  className?: string
  disabled?: boolean
  prefixContent?: ReactNode
  suffixContent?: ReactNode
  showWhenSingleFile?: boolean
}
