import { EnhancedFileSelectorCombobox } from "../RunFrameWithApi/EnhancedFileSelectorCombobox/EnhancedFileSelectorCombobox"

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
      fileFilter={() => true}
      placeholder="Select circuit"
      searchPlaceholder="Search for circuit file"
      emptyMessage="No circuit files found in this directory."
    />
  )
}
