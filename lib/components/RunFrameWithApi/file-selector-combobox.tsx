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
        <button
          type="button"
          className="rf-inline-flex rf-h-10 rf-w-30 rf-items-center rf-justify-between rf-whitespace-nowrap rf-rounded-md rf-border rf-border-input rf-bg-background rf-px-3 rf-py-2 rf-text-sm rf-ring-offset-background rf-placeholder:rf-text-muted-foreground focus:rf-outline-none focus:rf-ring-2 focus:rf-ring-ring focus:rf-ring-offset-2 disabled:rf-cursor-not-allowed disabled:rf-opacity-50 [&>span]:rf-line-clamp-1"
          aria-expanded={open}
        >
          {file ? file : "Select file"}
          <ChevronsUpDown className="rf-opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="rf-w-fit !rf-p-0">
        <Command>
          <CommandInput placeholder="Search for file" className="rf-h-9" />
          <CommandList>
            <CommandEmpty>No file found.</CommandEmpty>
            <CommandGroup>
              {files
                .filter(
                  (file) =>
                    (file.endsWith(".tsx") ||
                      file.endsWith(".ts") ||
                      file.endsWith(".jsx") ||
                      file.endsWith(".js") ||
                      file.endsWith(".json")) &&
                    !file.endsWith(".d.ts"),
                )
                .map((file, i) => (
                  <CommandItem
                    key={i}
                    value={file}
                    onSelect={(file) => {
                      setFile(file)
                      setOpen(false)
                      onFileChange(file)
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
