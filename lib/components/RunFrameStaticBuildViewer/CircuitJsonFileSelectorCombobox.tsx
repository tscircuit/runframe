import {
  EnhancedFileSelectorCombobox,
  type FileSelectorConfig,
} from "../RunFrameWithApi/EnhancedFileSelectorCombobox/EnhancedFileSelectorCombobox"

const circuitJsonConfig: FileSelectorConfig = {
  fileFilter: () => true,
  getDisplayName: (filePath: string) => {
    const fileName = filePath.split("/").pop() || ""
    return fileName.replace(/\.circuit\.json$/, "").replace(/\.json$/, "")
  },
  placeholder: "Select circuit",
  searchPlaceholder: "Search for circuit file",
  emptyMessage: "No circuit files found in this directory.",
}

export const CircuitJsonFileSelectorCombobox = ({
  files,
  onFileChange,
  currentFile,
}: {
  files: string[]
  currentFile: string
  onFileChange: (value: string) => void
}) => {
  return (
    <EnhancedFileSelectorCombobox
      files={files}
      onFileChange={onFileChange}
      currentFile={currentFile}
      config={circuitJsonConfig}
    />
  )
}
