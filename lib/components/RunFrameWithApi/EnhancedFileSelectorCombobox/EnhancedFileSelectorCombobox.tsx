import { useEffect, useState } from "react"
import { useCurrentFolder } from "./useCurrentFolder"
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
  ArrowUp,
  Star,
} from "lucide-react"
import { cn } from "lib/utils"
import {
  parseFilesToTree,
  getCurrentFolderContents,
  type FileNode,
} from "./parseFilesToTree"

export interface FileSelectorConfig {
  fileFilter?: (filename: string) => boolean
  getDisplayName?: (filename: string) => string
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  /**
   * Array of file paths to pin at the top of the file selector.
   * Pinned files appear in a "Favorites" section for quick access.
   */
  pinnedFiles?: string[]
  /**
   * Callback when a file is toggled as favorite.
   */
  onToggleFavorite?: (filePath: string) => void
}

const defaultFileIcon = (fileName: string) => {
  if (fileName.endsWith(".tsx") || fileName.endsWith(".jsx")) {
    return <Code className="rf-h-4 rf-w-4 rf-text-blue-500" />
  }
  if (fileName.endsWith(".md") || fileName.endsWith(".txt")) {
    return <FileText className="rf-h-4 rf-w-4 rf-text-gray-600" />
  }
  return <File className="rf-h-4 rf-w-4 rf-text-gray-500" />
}

const defaultFileFilter = (filename: string) => {
  return (
    filename.endsWith(".tsx") ||
    filename.endsWith(".circuit.json") ||
    filename.endsWith(".jsx")
  )
}

const defaultDisplayName = (filename: string) => {
  return filename.split("/").pop() || ""
}

const getDirectoryPath = (filePath: string) => {
  return filePath.substring(0, filePath.lastIndexOf("/")) || "/"
}

export const EnhancedFileSelectorCombobox = ({
  files,
  onFileChange,
  currentFile,
  config = {},
}: {
  files: string[]
  currentFile: string
  onFileChange: (value: string) => void
  config?: FileSelectorConfig
}) => {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState(currentFile)
  const { currentFolder, navigateToFolder, resetManualNavigation } =
    useCurrentFolder({ currentFile: file, files })
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [searchValue, setSearchValue] = useState("")

  const {
    fileFilter = defaultFileFilter,
    getDisplayName = defaultDisplayName,
    placeholder = "Select file",
    searchPlaceholder = "Search for file",
    emptyMessage = "No files found in this directory.",
    pinnedFiles = [],
    onToggleFavorite,
  } = config

  useEffect(() => {
    setFile(currentFile)
  }, [currentFile])

  const filteredFiles = files.filter(fileFilter)

  const fileTree = parseFilesToTree(filteredFiles)
  const { files: currentFiles, folders: currentFolders } =
    getCurrentFolderContents(fileTree, currentFolder || "")

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
  const handleNavigateToFolder = (folderPath: string | null) => {
    navigateToFolder(folderPath)
    setCurrentFileIndex(0)
  }

  const navigateUp = () => {
    if (!currentFolder) return
    const lastSlashIndex = currentFolder.lastIndexOf("/")
    const parentPath =
      lastSlashIndex === -1 ? null : currentFolder.substring(0, lastSlashIndex)
    handleNavigateToFolder(parentPath)
  }

  const selectFile = (
    filePath: string,
    index: number,
    updateFolder = false,
  ) => {
    setFile(filePath)
    setCurrentFileIndex(index)
    setOpen(false)
    onFileChange(filePath)

    if (updateFolder) {
      const lastSlashIndex = filePath.lastIndexOf("/")
      const fileDir =
        lastSlashIndex === -1 ? null : filePath.substring(0, lastSlashIndex)
      handleNavigateToFolder(fileDir)
    }
  }

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

  const displayPath = currentFolder ?? "/"
  const shortDisplayPath =
    displayPath.length > 25 ? "..." + displayPath.slice(-22) : displayPath // Fixed width to eliminate jitter - no dynamic sizing
  const getDropdownWidth = () => {
    const maxWidth = isSearching ? "rf-max-w-[600px]" : "rf-max-w-[1000px]"
    return `rf-w-full rf-min-w-[600px] ${maxWidth}`
  }

  return (
    <div className="rf-flex rf-items-center rf-gap-1">
      <Popover
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen)
          if (!newOpen) {
            setSearchValue("")
            resetManualNavigation()
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="rf-w-fit rf-min-w-32 rf-max-w-100 rf-justify-center rf-items-center rf-gap-1 !rf-font-normal"
          >
            <span className="rf-truncate rf-text-left">
              {file ? getDisplayName(file) : placeholder}
            </span>
            <ChevronsUpDown className="rf-opacity-50 rf-flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "!rf-p-0 !rf-overflow-hidden !rf-z-[200]",
            getDropdownWidth(),
          )}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              className="rf-h-9 rf-w-full"
              value={searchValue}
              onValueChange={setSearchValue}
            />

            {/* Directory Header */}
            <div className="rf-px-3 rf-py-2 rf-border-t rf-border-b rf-border-gray-200 rf-bg-slate-50">
              <div className="rf-flex rf-items-center rf-justify-between rf-text-xs rf-text-slate-600 rf-min-w-0 rf-overflow-hidden">
                <div className="rf-flex rf-items-center rf-min-w-0 rf-flex-1">
                  <button
                    onClick={() => handleNavigateToFolder(null)}
                    className="rf-text-blue-600 hover:rf-text-blue-800 rf-underline rf-cursor-pointer rf-bg-transparent rf-border-none rf-p-0 rf-flex-shrink-0"
                  >
                    root
                  </button>
                  {currentFolder
                    ?.split("/")
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
                              className="rf-text-slate-800 rf-truncate rf-max-w-[200px]"
                              title={segment}
                            >
                              {segment}
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                handleNavigateToFolder(pathToSegment)
                              }
                              className="rf-text-blue-600 hover:rf-text-blue-800 rf-underline rf-cursor-pointer rf-bg-transparent rf-border-none rf-p-0 rf-truncate rf-max-w-[150px]"
                              title={segment}
                            >
                              {segment}
                            </button>
                          )}
                        </span>
                      )
                    })}
                </div>
                {currentFolder && (
                  <button
                    onClick={navigateUp}
                    className="rf-ml-2 rf-flex rf-items-center rf-gap-1 rf-text-blue-600 hover:rf-text-blue-800 rf-bg-transparent rf-border rf-border-blue-300 hover:rf-border-blue-500 rf-rounded rf-px-2 rf-py-1 rf-flex-shrink-0"
                    title="Go up one level"
                  >
                    <ArrowUp className="rf-h-3 rf-w-3" />
                    <span>Up</span>
                  </button>
                )}
              </div>
            </div>

            <CommandList className="rf-max-h-[70vh] rf-overflow-y-auto">
              {!isSearching ? (
                <>
                  <CommandEmpty>{emptyMessage}</CommandEmpty>

                  {/* Pinned/Favorites Section */}
                  {pinnedFiles.length > 0 && (
                    <CommandGroup
                      heading="Favorites"
                      className="rf-border-b rf-border-gray-200 rf-pb-1 rf-bg-amber-50/30"
                    >
                      {pinnedFiles
                        .filter((path) => filteredFiles.includes(path))
                        .map((path, index) => (
                          <CommandItem
                            key={path}
                            value={path}
                            onSelect={() => selectFile(path, index, true)}
                            className={cn(
                              path === currentFile && "rf-font-medium",
                            )}
                          >
                            <Star className="rf-mr-2 rf-h-4 rf-w-4 rf-text-amber-500 rf-fill-amber-500" />
                            {getDisplayName(path.split("/").pop() || "")}
                            <span className="rf-text-xs rf-text-muted-foreground rf-ml-2 rf-truncate rf-max-w-[40%]">
                              {getDirectoryPath(path)}
                            </span>
                            <Check
                              className={cn(
                                "rf-ml-auto rf-h-4 rf-w-4",
                                path === currentFile
                                  ? "rf-opacity-100"
                                  : "rf-opacity-0",
                              )}
                            />
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  )}

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
                            "rf-group",
                          )}
                        >
                          <span className="rf-mr-2">
                            {defaultFileIcon(fileNode.name)}
                          </span>
                          {getDisplayName(fileNode.name)}
                          <div className="rf-ml-auto rf-flex rf-items-center rf-gap-1">
                            {onToggleFavorite && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onToggleFavorite(fileNode.path)
                                }}
                                className={cn(
                                  "rf-p-1 rf-rounded hover:rf-bg-slate-200 rf-transition-opacity",
                                  pinnedFiles.includes(fileNode.path)
                                    ? "rf-opacity-100"
                                    : "rf-opacity-0 group-hover:rf-opacity-100",
                                )}
                                aria-label={
                                  pinnedFiles.includes(fileNode.path)
                                    ? "Remove from favorites"
                                    : "Add to favorites"
                                }
                                title={
                                  pinnedFiles.includes(fileNode.path)
                                    ? "Remove from favorites"
                                    : "Add to favorites"
                                }
                              >
                                <Star
                                  className={cn(
                                    "rf-h-3 rf-w-3",
                                    pinnedFiles.includes(fileNode.path)
                                      ? "rf-text-amber-500 rf-fill-amber-500"
                                      : "rf-text-slate-400",
                                  )}
                                />
                              </button>
                            )}
                            <Check
                              className={cn(
                                "rf-h-4 rf-w-4",
                                fileNode.path === currentFile
                                  ? "rf-opacity-100"
                                  : "rf-opacity-0",
                              )}
                            />
                          </div>
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
                          onSelect={() =>
                            handleNavigateToFolder(folderNode.path)
                          }
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
                                  "rf-group",
                                )}
                              >
                                <span className="rf-mr-2">
                                  {defaultFileIcon(file.fileName)}
                                </span>
                                <div className="rf-flex rf-items-center rf-w-full rf-min-w-0">
                                  <span className="rf-truncate rf-flex-1">
                                    {getDisplayName(file.fileName)}
                                  </span>
                                  <span className="rf-text-xs rf-text-muted-foreground rf-ml-2 rf-truncate rf-max-w-[40%]">
                                    {currentFolder || "/"}
                                  </span>
                                  {onToggleFavorite && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onToggleFavorite(file.path)
                                      }}
                                      className={cn(
                                        "rf-p-1 rf-rounded hover:rf-bg-slate-200 rf-transition-opacity rf-ml-2",
                                        pinnedFiles.includes(file.path)
                                          ? "rf-opacity-100"
                                          : "rf-opacity-0 group-hover:rf-opacity-100",
                                      )}
                                      aria-label={
                                        pinnedFiles.includes(file.path)
                                          ? "Remove from favorites"
                                          : "Add to favorites"
                                      }
                                      title={
                                        pinnedFiles.includes(file.path)
                                          ? "Remove from favorites"
                                          : "Add to favorites"
                                      }
                                    >
                                      <Star
                                        className={cn(
                                          "rf-h-3 rf-w-3",
                                          pinnedFiles.includes(file.path)
                                            ? "rf-text-amber-500 rf-fill-amber-500"
                                            : "rf-text-slate-400",
                                        )}
                                      />
                                    </button>
                                  )}
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
                                "rf-group",
                              )}
                            >
                              <span className="rf-mr-2">
                                {defaultFileIcon(file.fileName)}
                              </span>
                              <div className="rf-flex rf-items-center rf-w-full rf-min-w-0">
                                <span className="rf-truncate rf-flex-1">
                                  {getDisplayName(file.fileName)}
                                </span>
                                <span className="rf-text-xs rf-text-muted-foreground rf-ml-2 rf-truncate rf-max-w-[40%]">
                                  {getDirectoryPath(file.path)}
                                </span>
                                {onToggleFavorite && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onToggleFavorite(file.path)
                                    }}
                                    className={cn(
                                      "rf-p-1 rf-rounded hover:rf-bg-slate-200 rf-transition-opacity rf-ml-2",
                                      pinnedFiles.includes(file.path)
                                        ? "rf-opacity-100"
                                        : "rf-opacity-0 group-hover:rf-opacity-100",
                                    )}
                                    title={
                                      pinnedFiles.includes(file.path)
                                        ? "Remove from favorites"
                                        : "Add to favorites"
                                    }
                                  >
                                    <Star
                                      className={cn(
                                        "rf-h-3 rf-w-3",
                                        pinnedFiles.includes(file.path)
                                          ? "rf-text-amber-500 rf-fill-amber-500"
                                          : "rf-text-slate-400",
                                      )}
                                    />
                                  </button>
                                )}
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
