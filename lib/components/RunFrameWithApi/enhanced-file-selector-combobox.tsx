import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import {
  ChevronsUpDown,
  Check,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  FileCode,
  ChevronLeft,
} from "lucide-react"
import { cn } from "lib/utils"

interface FileNode {
  name: string
  path: string
  type: "file" | "folder"
  children?: FileNode[]
  isExpanded?: boolean
}

interface EnhancedFileSelectorComboboxProps {
  files: string[]
  currentFile: string
  onFileChange: (value: string) => void
}

export const EnhancedFileSelectorCombobox = ({
  files,
  onFileChange,
  currentFile,
}: EnhancedFileSelectorComboboxProps) => {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState(currentFile)
  const [expandedFolders, setExpandedFolders] = useState(new Set<string>())
  const [currentDirectory, setCurrentDirectory] = useState<string>("")

  useEffect(() => {
    setFile(currentFile)
    // Set current directory based on current file
    const dir = currentFile.includes("/")
      ? currentFile.substring(0, currentFile.lastIndexOf("/"))
      : ""
    setCurrentDirectory(dir)
  }, [currentFile])

  // Build file tree structure
  const buildFileTree = (files: string[]): FileNode[] => {
    const root: FileNode[] = []
    const pathMap = new Map<string, FileNode>()

    // Filter files to only include supported types
    const supportedFiles = files.filter(
      (file) =>
        (file.endsWith(".tsx") ||
          file.endsWith(".ts") ||
          file.endsWith(".jsx") ||
          file.endsWith(".js") ||
          file.endsWith(".json")) &&
        !file.endsWith(".d.ts"),
    )

    for (const filePath of supportedFiles) {
      const parts = filePath.split("/")
      let currentPath = ""

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const parentPath = currentPath
        currentPath = currentPath ? `${currentPath}/${part}` : part

        if (!pathMap.has(currentPath)) {
          const isFile = i === parts.length - 1
          const node: FileNode = {
            name: part,
            path: currentPath,
            type: isFile ? "file" : "folder",
            children: isFile ? undefined : [],
            isExpanded: expandedFolders.has(currentPath),
          }

          pathMap.set(currentPath, node)

          if (parentPath) {
            const parent = pathMap.get(parentPath)
            if (parent?.children) {
              parent.children.push(node)
            }
          } else {
            root.push(node)
          }
        }
      }
    }

    // Sort folders first, then files
    const sortNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "folder" ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
    }

    const sortRecursively = (nodes: FileNode[]): FileNode[] => {
      for (const node of nodes) {
        if (node.children) {
          node.children = sortRecursively(node.children)
        }
      }
      return sortNodes(nodes)
    }

    return sortRecursively(root)
  }

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath)
      } else {
        newSet.add(folderPath)
      }
      return newSet
    })
  }

  const navigateToDirectory = (path: string) => {
    setCurrentDirectory(path)
  }

  const navigateUp = () => {
    if (currentDirectory) {
      const parentDir = currentDirectory.includes("/")
        ? currentDirectory.substring(0, currentDirectory.lastIndexOf("/"))
        : ""
      setCurrentDirectory(parentDir)
    }
  }

  // Enhanced UI/UX for folder/file rendering
  const renderFileNode = (node: FileNode, depth = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.path)
    const isCurrentFile = node.path === currentFile

    return (
      <div key={node.path} style={{ paddingLeft: depth * 12 }}>
        {node.type === "folder" ? (
          <CommandItem
            value={node.path}
            onSelect={() => toggleFolder(node.path)}
            className="group flex items-center cursor-pointer hover:bg-zinc-100 rounded px-2 py-1"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            )}
            <FolderOpen className="h-4 w-4 text-amber-600 ml-1" />
            <span className="ml-2 font-medium">{node.name}</span>
          </CommandItem>
        ) : (
          <CommandItem
            value={node.path}
            onSelect={() => {
              setFile(node.path)
              setOpen(false)
              onFileChange(node.path)
            }}
            className={cn(
              "flex items-center cursor-pointer hover:bg-zinc-100 rounded px-2 py-1",
              isCurrentFile && "bg-blue-50 font-semibold",
            )}
          >
            <FileCode className="h-4 w-4 text-blue-600" />
            <span className="ml-2">{node.name}</span>
            {isCurrentFile && (
              <Check className="ml-auto h-3.5 w-3.5 text-blue-600" />
            )}
          </CommandItem>
        )}
        {node.type === "folder" && isExpanded && node.children && (
          <div>
            {node.children.map((child) => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const fileTree = buildFileTree(files)

  // Get all nodes in the current directory
  const currentDirFiles = fileTree.filter((node) => {
    // For root directory
    if (currentDirectory === "") {
      const isAtRoot = !node.path.includes("/")
      return isAtRoot
    }

    // For subdirectories
    const nodeDir = node.path.includes("/")
      ? node.path.substring(0, node.path.lastIndexOf("/"))
      : ""

    // Show if:
    // 1. It's a direct child of current directory, or
    // 2. It's a folder that matches the current directory path
    const isDirectChild = nodeDir === currentDirectory
    const isCurrentDirFolder =
      node.type === "folder" && node.path === currentDirectory

    return isDirectChild || isCurrentDirFolder
  })

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
      <PopoverContent className="rf-w-96 !rf-p-0">
        <Command>
          <CommandInput placeholder="Search for file" className="rf-h-9" />
          <CommandList>
            <CommandEmpty>No file found.</CommandEmpty>

            {/* Breadcrumb Navigation */}
            <CommandGroup>
              <div className="rf-px-3 rf-py-2 rf-text-xs rf-bg-zinc-50 rf-border-b rf-border-zinc-200">
                <div className="rf-flex rf-items-center rf-gap-1 rf-flex-wrap rf-min-h-6">
                  <div className="rf-flex-1 rf-flex rf-items-center rf-flex-wrap rf-gap-1">
                    <button
                      onClick={() => navigateToDirectory("")}
                      className={cn(
                        "rf-flex rf-items-center rf-gap-1 rf-px-2 rf-py-1 rf-rounded hover:rf-bg-zinc-100",
                        !currentDirectory && "rf-bg-zinc-100 rf-font-medium",
                      )}
                    >
                      <FolderOpen className="rf-h-3 rf-w-3 rf-text-zinc-600" />
                    </button>

                    {currentDirectory
                      .split("/")
                      .filter(Boolean)
                      .map((part, index, parts) => {
                        const path = parts.slice(0, index + 1).join("/")
                        return (
                          <div key={path} className="rf-flex rf-items-center">
                            <ChevronRight className="rf-h-3 rf-w-3 rf-mx-1 rf-text-zinc-400" />
                            <button
                              onClick={() => navigateToDirectory(path)}
                              className={cn(
                                "rf-px-2 rf-py-1 rf-rounded hover:rf-bg-zinc-100 hover:rf-underline rf-text-zinc-700",
                                path === currentDirectory
                                  ? "rf-bg-zinc-100 rf-font-medium"
                                  : "",
                              )}
                            >
                              {part}
                            </button>
                          </div>
                        )
                      })}

                    {!currentDirectory && (
                      <span className="rf-px-2 rf-py-1 rf-text-zinc-500">
                        /
                      </span>
                    )}
                  </div>

                  {currentDirectory && (
                    <button
                      onClick={navigateUp}
                      className="rf-p-1 rf-rounded-full hover:rf-bg-zinc-100 rf-text-zinc-500 hover:rf-text-zinc-700"
                      title="Go up one level"
                    >
                      <ChevronLeft className="rf-h-3.5 rf-w-3.5" />
                    </button>
                  )}
                </div>

                {currentDirectory && (
                  <div className="rf-mt-1 rf-text-xs rf-text-zinc-500 rf-font-mono">
                    {currentDirectory}/
                  </div>
                )}
              </div>
            </CommandGroup>

            {/* Current Directory Files */}
            <CommandGroup>
              {currentDirFiles.map((node) => renderFileNode(node))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
