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
  Folder,
  File,
  ArrowUp,
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

  const navigateToParent = () => {
    if (currentDirectory) {
      const parentDir = currentDirectory.includes("/")
        ? currentDirectory.substring(0, currentDirectory.lastIndexOf("/"))
        : ""
      setCurrentDirectory(parentDir)
    }
  }

  const renderFileNode = (node: FileNode, depth = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.path)
    const isCurrentFile = node.path === currentFile
    const isInCurrentDir =
      currentDirectory === "" ||
      node.path.startsWith(`${currentDirectory}/`) ||
      node.path === currentDirectory

    // If we're showing current directory content, filter accordingly
    if (currentDirectory && !isInCurrentDir && node.type === "file") {
      return null
    }

    if (node.type === "folder") {
      return (
        <div key={node.path}>
          <CommandItem
            value={node.path}
            onSelect={() => toggleFolder(node.path)}
            className="rf-cursor-pointer"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="rf-h-4 rf-w-4" />
            ) : (
              <ChevronRight className="rf-h-4 rf-w-4" />
            )}
            <Folder className="rf-h-4 rf-w-4 rf-mr-2" />
            <span className="rf-font-medium">{node.name}</span>
          </CommandItem>
          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderFileNode(child, depth + 1))}
            </div>
          )}
        </div>
      )
    } else {
      return (
        <CommandItem
          key={node.path}
          value={node.path}
          onSelect={(file) => {
            setFile(file)
            setOpen(false)
            onFileChange(file)
          }}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <File className="rf-h-4 rf-w-4 rf-mr-2" />
          <span
            className={cn(
              isCurrentFile ? "rf-font-semibold" : "rf-font-normal",
            )}
          >
            {node.name}
          </span>
          <Check
            className={cn(
              "rf-ml-auto",
              isCurrentFile ? "rf-opacity-100" : "rf-opacity-0",
            )}
          />
        </CommandItem>
      )
    }
  }

  const fileTree = buildFileTree(files)
  const currentDirFiles = currentDirectory
    ? fileTree.filter(
        (node) =>
          node.path === currentDirectory ||
          node.path.startsWith(`${currentDirectory}/`),
      )
    : fileTree

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

            {/* Current Directory Header */}
            {currentDirectory && (
              <>
                <CommandGroup>
                  <div className="rf-px-2 rf-py-1.5 rf-text-xs rf-font-medium rf-text-zinc-500 rf-border-b rf-border-zinc-200">
                    <div className="rf-flex rf-items-center rf-gap-2">
                      <span>Current Directory:</span>
                      <span className="rf-font-mono rf-text-zinc-700">
                        {currentDirectory || "/"}
                      </span>
                    </div>
                  </div>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Parent Directory Navigation */}
            {currentDirectory && (
              <CommandGroup>
                <CommandItem
                  onSelect={navigateToParent}
                  className="rf-cursor-pointer rf-text-zinc-600"
                >
                  <ArrowUp className="rf-h-4 rf-w-4 rf-mr-2" />
                  <span className="rf-font-medium">Go to Parent Directory</span>
                </CommandItem>
              </CommandGroup>
            )}

            {/* File Tree */}
            <CommandGroup>
              {currentDirFiles.map((node) => renderFileNode(node))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
