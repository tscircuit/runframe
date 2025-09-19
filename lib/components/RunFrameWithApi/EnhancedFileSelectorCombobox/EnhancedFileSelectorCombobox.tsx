import { useEffect, useState } from "react"
import { Button } from "../../ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover"
import {
  ChevronsUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  File,
  FileText,
  Code,
  Folder,
} from "lucide-react"
import { cn } from "lib/utils"
import {
  parseFilesToTree,
  getCurrentFolderContents,
  type FileNode,
} from "./parseFilesToTree"

function getFileIcon(fileName: string) {
  if (fileName.endsWith(".tsx") || fileName.endsWith(".jsx")) {
    return <Code className="rf-h-4 rf-w-4 rf-text-blue-500" />
  }
  if (fileName.endsWith(".ts") || fileName.endsWith(".js")) {
    return <Code className="rf-h-4 rf-w-4 rf-text-yellow-600" />
  }
  if (fileName.endsWith(".md") || fileName.endsWith(".txt")) {
    return <FileText className="rf-h-4 rf-w-4 rf-text-gray-600" />
  }
  return <File className="rf-h-4 rf-w-4 rf-text-gray-500" />
}

export const EnhancedFileSelectorCombobox = ({
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
  const [currentFolder, setCurrentFolder] = useState("")
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [searchValue, setSearchValue] = useState("")

  useEffect(() => {
    setFile(currentFile)
  }, [currentFile])

  const filteredFiles = files.filter((file) => {
    const fileName = file.split("/").pop() ?? ""
    const lowerCaseFileName = fileName.toLowerCase()
    const isScriptFile =
      file.endsWith(".tsx") ||
      file.endsWith(".ts") ||
      file.endsWith(".jsx") ||
      file.endsWith(".js")

    if (!isScriptFile || file.endsWith(".d.ts")) return false

    if (lowerCaseFileName.startsWith("test.tsx")) {
      return false
    }

    return true
  })

  const fileTree = parseFilesToTree(filteredFiles)
  const { files: currentFiles, folders: currentFolders } =
    getCurrentFolderContents(fileTree, currentFolder)

  // Search logic - when searching, show results with full paths
  const getSearchResults = () => {
    if (!searchValue.trim()) return { currentDirResults: [], globalResults: [] }

    const searchTerm = searchValue.toLowerCase()
    const allFiles = filteredFiles.map((path) => {
      const fileName = path.split("/").pop() || ""
      return { path, fileName }
    })

    // Filter files that match search
    const matchingFiles = allFiles.filter(
      (file) =>
        file.fileName.toLowerCase().includes(searchTerm) ||
        file.path.toLowerCase().includes(searchTerm),
    )

    // Separate current directory results from global results
    const currentDirResults = matchingFiles.filter((file) => {
      if (!currentFolder) {
        // Root level - files with no folder separators
        return !file.path.includes("/")
      }
      // Files in current folder
      const fileDir = file.path.substring(0, file.path.lastIndexOf("/"))
      return fileDir === currentFolder
    })

    const globalResults = matchingFiles.filter((file) => {
      if (!currentFolder) {
        // Root level - files with folder separators (not in root)
        return file.path.includes("/")
      }
      // Files not in current folder
      const fileDir = file.path.substring(0, file.path.lastIndexOf("/"))
      return fileDir !== currentFolder
    })

    return { currentDirResults, globalResults }
  }

  const searchResults = getSearchResults()
  const isSearching = searchValue.trim().length > 0

  const canGoBack = currentFolder !== ""
  const canGoLeft = currentFiles.length > 0 && currentFileIndex > 0
  const canGoRight =
    currentFiles.length > 0 && currentFileIndex < currentFiles.length - 1

  const navigateToFolder = (folderPath: string) => {
    setCurrentFolder(folderPath)
    setCurrentFileIndex(0)
  }

  const goBack = () => {
    if (currentFolder) {
      const parentPath = currentFolder.includes("/")
        ? currentFolder.substring(0, currentFolder.lastIndexOf("/"))
        : ""
      setCurrentFolder(parentPath)
      setCurrentFileIndex(0)
    }
  }

  const goLeft = () => {
    if (canGoLeft) {
      const newIndex = currentFileIndex - 1
      setCurrentFileIndex(newIndex)
      const selectedFile = currentFiles[newIndex]
      setFile(selectedFile.path)
      onFileChange(selectedFile.path)
    }
  }

  const goRight = () => {
    if (canGoRight) {
      const newIndex = currentFileIndex + 1
      setCurrentFileIndex(newIndex)
      const selectedFile = currentFiles[newIndex]
      setFile(selectedFile.path)
      onFileChange(selectedFile.path)
    }
  }

  const selectFile = (filePath: string, index: number) => {
    setFile(filePath)
    setCurrentFileIndex(index)
    setOpen(false)
    onFileChange(filePath)
  }

  // Update current file index when folder changes
  useEffect(() => {
    if (currentFiles.length > 0) {
      const fileInCurrentFolder = currentFiles.findIndex(
        (f) => f.path === currentFile,
      )
      if (fileInCurrentFolder >= 0) {
        setCurrentFileIndex(fileInCurrentFolder)
      }
    }
  }, [currentFiles, currentFile])

  const displayPath = currentFolder || "/"
  const shortDisplayPath =
    displayPath.length > 25 ? "..." + displayPath.slice(-22) : displayPath // Fixed width to eliminate jitter - no dynamic sizing
  const getDropdownWidth = () => {
    return "rf-w-[400px] rf-min-w-[400px] rf-max-w-[400px]"
  }

  return (
    <div className="rf-flex rf-items-center rf-gap-1">
      {/* Main selector */}
      <Popover
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen)
          if (!newOpen) setSearchValue("")
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="rf-w-fit rf-min-w-32 rf-max-w-64 rf-justify-center rf-items-center rf-gap-1 !rf-font-normal rf-min-w-0"
          >
            <span className="rf-truncate rf-text-left">
              {file ? file.split("/").pop() : "Select file"}
            </span>
            <ChevronsUpDown className="rf-opacity-50 rf-flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "!rf-p-0 !rf-overflow-x-auto !rf-z-[200]",
            getDropdownWidth(),
          )}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search for file"
              className="rf-h-9 rf-w-full"
              value={searchValue}
              onValueChange={setSearchValue}
            />

            {/* Directory Header */}
            <div className="rf-px-3 rf-py-2 rf-border-t rf-border-b rf-border-gray-200 rf-bg-slate-50">
              <div className="rf-flex rf-items-center rf-text-xs rf-text-slate-600 rf-min-w-0 rf-overflow-hidden">
                <button
                  onClick={() => navigateToFolder("")}
                  className="rf-text-blue-600 hover:rf-text-blue-800 rf-underline rf-cursor-pointer rf-bg-transparent rf-border-none rf-p-0 rf-flex-shrink-0"
                >
                  root
                </button>
                {currentFolder
                  .split("/")
                  .filter(Boolean)
                  .map((segment, index, array) => {
                    const pathToSegment = array.slice(0, index + 1).join("/")
                    return (
                      <span
                        key={pathToSegment}
                        className="rf-flex rf-items-center rf-min-w-0"
                      >
                        <span className="rf-mx-1 rf-flex-shrink-0">/</span>
                        {index === array.length - 1 ? (
                          <span
                            className="rf-text-slate-800 rf-truncate rf-max-w-[150px]"
                            title={segment}
                          >
                            {segment}
                          </span>
                        ) : (
                          <button
                            onClick={() => navigateToFolder(pathToSegment)}
                            className="rf-text-blue-600 hover:rf-text-blue-800 rf-underline rf-cursor-pointer rf-bg-transparent rf-border-none rf-p-0 rf-truncate rf-max-w-[100px]"
                            title={segment}
                          >
                            {segment}
                          </button>
                        )}
                      </span>
                    )
                  })}
              </div>
            </div>

            <CommandList className="rf-max-h-[70vh] rf-overflow-y-auto">
              {!isSearching ? (
                <>
                  <CommandEmpty>No files found in this directory.</CommandEmpty>

                  {/* Current Directory Files */}
                  {currentFiles.length > 0 && (
                    <CommandGroup
                      className={`rf-border-b rf-border-gray-200 rf-pb-1`}
                    >
                      {currentFiles.map((fileNode, index) => (
                        <CommandItem
                          key={fileNode.path}
                          value={fileNode.path}
                          onSelect={() => selectFile(fileNode.path, index)}
                          className={cn(
                            fileNode.path === currentFile && "rf-font-medium",
                          )}
                        >
                          <span className="rf-mr-2">
                            {getFileIcon(fileNode.name)}
                          </span>
                          {fileNode.name}
                          <Check
                            className={cn(
                              "rf-ml-auto rf-h-4 rf-w-4",
                              fileNode.path === currentFile
                                ? "rf-opacity-100"
                                : "rf-opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {/* Subdirectories */}
                  {currentFolders.length > 0 && (
                    <CommandGroup
                      className={`rf-border-b rf-border-gray-200 rf-pb-1`}
                    >
                      {currentFolders.map((folderNode) => (
                        <CommandItem
                          key={folderNode.path}
                          value={`folder-${folderNode.path}`}
                          onSelect={() => navigateToFolder(folderNode.path)}
                          className="rf-text-slate-600 hover:rf-text-slate-900"
                        >
                          <Folder className="rf-mr-2 rf-h-4 rf-w-4 rf-text-blue-600" />
                          {folderNode.name}
                          <ChevronRight className="rf-ml-auto rf-h-4 rf-w-4" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {/* Empty state */}
                  {currentFiles.length === 0 && currentFolders.length === 0 && (
                    <div className="rf-p-4 rf-text-center rf-text-slate-500 rf-text-sm">
                      No files or folders in this directory
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Search Results */}
                  {searchResults.currentDirResults.length === 0 &&
                  searchResults.globalResults.length === 0 ? (
                    <CommandEmpty>
                      No files found matching "{searchValue}".
                    </CommandEmpty>
                  ) : (
                    <>
                      {/* Current Directory Search Results */}
                      {searchResults.currentDirResults.length > 0 && (
                        <CommandGroup className="rf-border-b rf-border-gray-200 rf-pb-1">
                          {searchResults.currentDirResults.map(
                            (file, index) => (
                              <CommandItem
                                key={file.path}
                                value={file.path}
                                onSelect={() => {
                                  setFile(file.path)
                                  setOpen(false)
                                  onFileChange(file.path)
                                }}
                                className={cn(
                                  file.path === currentFile && "rf-font-medium",
                                )}
                              >
                                <span className="rf-mr-2">
                                  {getFileIcon(file.fileName)}
                                </span>
                                <div className="rf-flex rf-items-center rf-w-full rf-min-w-0">
                                  <span className="rf-truncate rf-flex-1">
                                    {file.fileName}
                                  </span>
                                  <span className="rf-text-xs rf-text-muted-foreground rf-ml-2 rf-truncate rf-max-w-[120px]">
                                    {currentFolder || "/"}
                                  </span>
                                  {file.path === currentFile && (
                                    <Check className="rf-ml-2 rf-h-4 rf-w-4 rf-flex-shrink-0" />
                                  )}
                                </div>
                              </CommandItem>
                            ),
                          )}
                        </CommandGroup>
                      )}

                      {/* Global Search Results */}
                      {searchResults.globalResults.length > 0 && (
                        <CommandGroup className="rf-pb-1">
                          {searchResults.globalResults.map((file) => (
                            <CommandItem
                              key={file.path}
                              value={file.path}
                              onSelect={() => {
                                setFile(file.path)
                                setOpen(false)
                                onFileChange(file.path)
                              }}
                              className={cn(
                                file.path === currentFile && "rf-font-medium",
                              )}
                            >
                              <span className="rf-mr-2">
                                {getFileIcon(file.fileName)}
                              </span>
                              <div className="rf-flex rf-items-center rf-w-full rf-min-w-0">
                                <span className="rf-truncate rf-flex-1">
                                  {file.fileName}
                                </span>
                                <span className="rf-text-xs rf-text-muted-foreground rf-ml-2 rf-truncate rf-max-w-[120px]">
                                  {file.path.substring(
                                    0,
                                    file.path.lastIndexOf("/"),
                                  ) || "/"}
                                </span>
                                {file.path === currentFile && (
                                  <Check className="rf-ml-2 rf-h-4 rf-w-4 rf-flex-shrink-0" />
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
