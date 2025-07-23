import { useEffect, useState } from "react"
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
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "lib/utils"

export const FileSelectorCombobox = ({
  files,
  onFileChange,
  currentFile,
}: {
  files: string[]
  currentFile: string
  onFileChange: (value: string) => void
}) => {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState(currentFile)
  useEffect(() => {
    setFile(currentFile)
  }, [currentFile])
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="rf-w-30 rf-justify-between !rf-font-normal"
        >
          {file ? file : "Select file..."}
          <ChevronsUpDown className="rf-opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="rf-w-fit !rf-p-0">
        <Command>
          <CommandInput placeholder="Search file..." className="rf-h-9" />
          <CommandList>
            <CommandEmpty>No file found.</CommandEmpty>
            <CommandGroup>
              {files
                .filter(
                  (file) =>
                    (file.endsWith(".tsx") ||
                      file.endsWith(".ts") ||
                      file.endsWith(".jsx") ||
                      file.endsWith(".js")) &&
                    !file.endsWith(".d.ts"),
                )
                .map((file, i) => (
                  <CommandItem
                    key={i}
                    value={file}
                    onSelect={(currentFile) => {
                      const newFile = currentFile === file ? "" : currentFile
                      setFile(newFile)
                      setOpen(false)
                      onFileChange(newFile)
                    }}
                  >
                    {file}
                    <Check
                      className={cn(
                        "rf-ml-auto",
                        file === currentFile
                          ? "rf-opacity-100"
                          : "rf-opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
