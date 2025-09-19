import { useState } from "react"
import { Button } from "../ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { ChevronsUpDown, Check, File } from "lucide-react"
import { cn } from "lib/utils"

export interface CircuitJsonFileSelectorProps {
  files: string[]
  currentFile: string
  onFileChange: (value: string) => void
}

export const CircuitJsonFileSelector = ({
  files,
  onFileChange,
  currentFile,
}: CircuitJsonFileSelectorProps) => {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  // Filter files based on search
  const filteredFiles = files.filter((file) =>
    file.toLowerCase().includes(searchValue.toLowerCase())
  )

  const selectFile = (filePath: string) => {
    onFileChange(filePath)
    setOpen(false)
    setSearchValue("")
  }

  const getDisplayName = (filePath: string) => {
    // Show just the filename for display
    return filePath.split("/").pop() || filePath
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="rf-w-fit rf-min-w-32 rf-max-w-64 rf-justify-center rf-items-center rf-gap-1 !rf-font-normal rf-min-w-0"
        >
          <span className="rf-truncate rf-text-left">
            {currentFile ? getDisplayName(currentFile) : "Select file"}
          </span>
          <ChevronsUpDown className="rf-opacity-50 rf-flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="!rf-p-0 !rf-overflow-x-auto !rf-z-[200] rf-w-80">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search circuit files..."
            className="rf-h-9 rf-w-full"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList className="rf-max-h-[70vh] rf-overflow-y-auto">
            {filteredFiles.length === 0 ? (
              <CommandEmpty>
                {searchValue ? `No files found matching "${searchValue}".` : "No circuit files found."}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredFiles.map((filePath) => (
                  <CommandItem
                    key={filePath}
                    value={filePath}
                    onSelect={() => selectFile(filePath)}
                    className={cn(
                      filePath === currentFile && "rf-font-medium",
                      "rf-cursor-pointer"
                    )}
                  >
                    <span className="rf-mr-2">
                      <File className="rf-h-4 rf-w-4" />
                    </span>
                    <div className="rf-flex rf-flex-col rf-min-w-0 rf-flex-1">
                      <span className="rf-truncate">{getDisplayName(filePath)}</span>
                      {filePath !== getDisplayName(filePath) && (
                        <span className="rf-text-xs rf-text-gray-500 rf-truncate">
                          {filePath}
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "rf-ml-auto rf-h-4 rf-w-4",
                        filePath === currentFile
                          ? "rf-opacity-100"
                          : "rf-opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
