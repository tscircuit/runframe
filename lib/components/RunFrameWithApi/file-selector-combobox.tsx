import { cn } from "lib/utils"
import { Check, ChevronsUpDown, File, Folder, FolderOpen } from "lucide-react"
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

interface FileTreeItem {
  name: string
  fullPath: string
  isFolder: boolean
  children?: FileTreeItem[]
  depth: number
}

const isRelevantSourceFile = (file: string): boolean => {
  return (
    (file.endsWith(".tsx") ||
      file.endsWith(".ts") ||
      file.endsWith(".jsx") ||
      file.endsWith(".js")) &&
    !file.endsWith(".d.ts")
  )
}

const buildFileTree = (files: string[]): FileTreeItem[] => {
  const tree: FileTreeItem[] = []

  // Filter to only include relevant files
  const relevantFiles = files.filter(isRelevantSourceFile)

  for (const filePath of relevantFiles) {
    const pathParts = filePath.split("/")
    let currentLevel = tree
    let currentPath = ""

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]
      const isLastPart = i === pathParts.length - 1
      currentPath = currentPath ? `${currentPath}/${part}` : part

      let existingItem = currentLevel.find((item) => item.name === part)

      if (!existingItem) {
        const newItem: FileTreeItem = {
          name: part,
          fullPath: isLastPart ? filePath : currentPath,
          isFolder: !isLastPart,
          children: isLastPart ? undefined : [],
          depth: i,
        }

        currentLevel.push(newItem)
        existingItem = newItem
      }

      if (!isLastPart && existingItem.children) {
        currentLevel = existingItem.children
      }
    }
  }

  return tree
}

const getCurrentFolderFiles = (
  files: string[],
  currentFile: string,
): string[] => {
  if (!currentFile) return []

  const currentFolder = currentFile.includes("/")
    ? currentFile.substring(0, currentFile.lastIndexOf("/"))
    : ""

  return files.filter((file) => {
    const fileFolder = file.includes("/")
      ? file.substring(0, file.lastIndexOf("/"))
      : ""
    return fileFolder === currentFolder
  })
}

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
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([])

  useEffect(() => {
    setFile(currentFile)
  }, [currentFile])

  useEffect(() => {
    const tree = buildFileTree(files)
    setFileTree(tree)

    if (currentFile) {
      const pathParts = currentFile.split("/")
      const newExpanded = new Set<string>()
      let currentPath = ""

      for (let i = 0; i < pathParts.length - 1; i++) {
        currentPath = currentPath
          ? `${currentPath}/${pathParts[i]}`
          : pathParts[i]
        newExpanded.add(currentPath)
      }

      setExpandedFolders(newExpanded)
    }
  }, [files, currentFile])

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath)
    } else {
      newExpanded.add(folderPath)
    }
    setExpandedFolders(newExpanded)
  }

  const renderFileTreeItems = (items: FileTreeItem[]): React.ReactNode[] => {
    const result: React.ReactNode[] = []

    for (const item of items) {
      if (item.isFolder) {
        const isExpanded = expandedFolders.has(item.fullPath)
        result.push(
          <CommandItem
            key={item.fullPath}
            value={item.fullPath}
            onSelect={() => toggleFolder(item.fullPath)}
            className="rf-cursor-pointer"
          >
            <div
              className="rf-flex rf-items-center rf-gap-2"
              style={{ paddingLeft: `${item.depth * 8}px` }}
            >
              {isExpanded ? (
                <FolderOpen className="rf-w-4 rf-h-4 rf-text-blue-500" />
              ) : (
                <Folder className="rf-w-4 rf-h-4 rf-text-blue-500" />
              )}
              <span className="rf-text-sm rf-font-medium">{item.name}</span>
            </div>
          </CommandItem>,
        )

        if (isExpanded && item.children) {
          result.push(...renderFileTreeItems(item.children))
        }
      } else {
        result.push(
          <CommandItem
            key={item.fullPath}
            value={item.fullPath}
            onSelect={(selectedPath) => {
              setFile(selectedPath)
              setOpen(false)
              onFileChange(selectedPath)
            }}
          >
            <div
              className="rf-flex rf-items-center rf-gap-2 rf-w-full"
              style={{ paddingLeft: `${item.depth * 8}px` }}
            >
              <File className="rf-w-4 rf-h-4 rf-text-gray-500" />
              <span className="rf-text-sm">{item.name}</span>
              <Check
                className={cn(
                  "rf-ml-auto rf-w-4 rf-h-4",
                  item.fullPath === currentFile
                    ? "rf-opacity-100"
                    : "rf-opacity-0",
                )}
              />
            </div>
          </CommandItem>,
        )
      }
    }

    return result
  }

  const currentFolderFiles = getCurrentFolderFiles(files, currentFile)
  const relevantCurrentFolderFiles = currentFolderFiles.filter(isRelevantSourceFile)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="rf-w-30 rf-justify-between !rf-font-normal rf-mr-40"
        >
          {file ? file : "Select file"}
          <ChevronsUpDown className="rf-opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="rf-w-fit !rf-p-0">
        <Command>
          <CommandInput placeholder="Search for file" className="rf-h-9" />
          <CommandList>
            <CommandEmpty>No file found.</CommandEmpty>
            {relevantCurrentFolderFiles.length > 0 &&
              currentFile.includes("/") && (
                <CommandGroup heading="Current Folder">
                  {relevantCurrentFolderFiles.map((filePath, i) => {
                    const fileName = filePath.split("/").pop() || filePath
                    return (
                      <CommandItem
                        key={`current-${i}`}
                        value={filePath}
                        onSelect={(file) => {
                          setFile(file)
                          setOpen(false)
                          onFileChange(file)
                        }}
                      >
                        <div className="rf-flex rf-items-center rf-gap-2 rf-w-full">
                          <File className="rf-w-4 rf-h-4 rf-text-gray-500" />
                          <span className="rf-text-sm">{fileName}</span>
                          <Check
                            className={cn(
                              "rf-ml-auto rf-w-4 rf-h-4",
                              filePath === currentFile
                                ? "rf-opacity-100"
                                : "rf-opacity-0",
                            )}
                          />
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            <CommandGroup heading="All Files">
              {renderFileTreeItems(fileTree)}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
