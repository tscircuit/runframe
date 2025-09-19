import { Search, FileJson } from "lucide-react"
import { EnhancedFileSelectorCombobox } from "../RunFrameWithApi/EnhancedFileSelectorCombobox/EnhancedFileSelectorCombobox"
import { cn } from "lib/utils"
import type { CircuitJsonFileSelectorProps } from "./CircuitJsonFileSelectorProps"

/**
 * A reusable component for selecting circuit JSON files from a list of available files.
 * 
 * This component provides a clean, searchable dropdown interface for selecting circuit JSON files.
 * It's designed to be used in various contexts where users need to switch between different
 * circuit configurations or designs.
 * 
 * @example
 * ```tsx
 * <CircuitJsonFileSelector
 *   files={["circuit.json", "board.json", "design.json"]}
 *   selectedFile={selectedFile}
 *   onFileChange={handleFileChange}
 *   label="Circuit File"
 *   placeholder="Search circuit files..."
 * />
 * ```
 */
export const CircuitJsonFileSelector = (props: CircuitJsonFileSelectorProps) => {
  const {
    files,
    selectedFile,
    onFileChange,
    placeholder = "Search circuit files...",
    label = "Circuit File",
    className,
    disabled = false,
    prefixContent,
    suffixContent,
    showWhenSingleFile = false
  } = props

  // Don't show the selector if there's only one file and showWhenSingleFile is false
  if (files.length <= 1 && !showWhenSingleFile) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Optional prefix content */}
      {prefixContent}
      
      {/* Label */}
      {label && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}:
        </span>
      )}
      
      {/* File selector */}
      <EnhancedFileSelectorCombobox
        files={files}
        currentFile={selectedFile}
        onFileChange={onFileChange}
        placeholder={placeholder}
        disabled={disabled}
        className="min-w-[200px]"
      />
      
      {/* Optional suffix content */}
      {suffixContent}
      
      {/* File icon */}
      <FileJson className="h-4 w-4 text-gray-500 dark:text-gray-400" />
    </div>
  )
}
