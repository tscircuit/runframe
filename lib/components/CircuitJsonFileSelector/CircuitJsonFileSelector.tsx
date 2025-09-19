import { Search, FileJson } from "lucide-react"
import { EnhancedFileSelectorCombobox } from "../RunFrameWithApi/EnhancedFileSelectorCombobox/EnhancedFileSelectorCombobox"
import { cn } from "lib/utils"
import type { CircuitJsonFileSelectorProps } from "./CircuitJsonFileSelectorProps"

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

  if (files.length <= 1 && !showWhenSingleFile) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {prefixContent}
      
      {label && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}:
        </span>
      )}
      
      <EnhancedFileSelectorCombobox
        files={files}
        currentFile={selectedFile}
        onFileChange={onFileChange}
        placeholder={placeholder}
        disabled={disabled}
        className="min-w-[200px]"
      />
      
      {suffixContent}
      
      <FileJson className="h-4 w-4 text-gray-500 dark:text-gray-400" />
    </div>
  )
}
