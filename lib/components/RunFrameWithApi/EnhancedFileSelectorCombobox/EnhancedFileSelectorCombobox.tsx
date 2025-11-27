import { useEffect, useState, useRef, useMemo, useCallback } from "react"
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
  Eye,
  EyeOff,
  Clock,
} from "lucide-react"
import { cn } from "lib/utils"
import {
  parseFilesToTree,
  getCurrentFolderContents,
  type FileNode,
} from "./parseFilesToTree"
import { useLocalStorageState } from "lib/hooks/use-local-storage-state"
import { useRunFrameStore } from "../store"

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
  fileFilter = defaultFileFilter,
  getDisplayName = defaultDisplayName,
  placeholder = "Select file",
  searchPlaceholder = "Search for file",
  emptyMessage = "No files found in this directory.",
  pinnedFiles = [],
  onToggleFavorite,
}: {
  files: string[]
  currentFile: string
  onFileChange: (value: string) => void
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
}) => {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState(currentFile)
  const { currentFolder, navigateToFolder, resetManualNavigation } =
    useCurrentFolder({ currentFile: file, files })
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [searchValue, setSearchValue] = useState("")
  const [recentlyViewedFiles, setRecentlyViewedFiles] = useLocalStorageState<
    string[]
  >("runframe:recentlyViewed", [])
  const [showRecents, setShowRecents] = useLocalStorageState(
    "runframe:showRecents",
    true,
  )
  const recentEvents = useRunFrameStore((state) => state.recentEvents)

  // Add global Cmd+K / Ctrl+K hotkey to open file selector
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const filteredFiles = files.filter(fileFilter)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const clearDebounceTimer = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }

    setFile(currentFile)
    if (currentFile && filteredFiles.includes(currentFile)) {
      clearDebounceTimer()

      debounceTimerRef.current = setTimeout(() => {
        setRecentlyViewedFiles((prev) => {
          // Only update if this file isn't already at the top
          if (prev[0] === currentFile) return prev
          const filtered = prev.filter((f) => f !== currentFile)
          return [currentFile, ...filtered].slice(0, 10)
        })
      }, 500)
    }

    return clearDebounceTimer
  }, [currentFile, filteredFiles, setRecentlyViewedFiles])

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

  const navigateUp = useCallback(() => {
    if (!currentFolder) return
    const lastSlashIndex = currentFolder.lastIndexOf("/")
    const parentPath =
      lastSlashIndex === -1 ? null : currentFolder.substring(0, lastSlashIndex)
    handleNavigateToFolder(parentPath)
  }, [currentFolder, handleNavigateToFolder])

  // Add Cmd+↑ / Ctrl+↑ shortcut to navigate up directory when file selector is open
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowUp") {
        e.preventDefault()
        navigateUp()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, navigateUp])

  const selectFile = useCallback(
    (filePath: string, index: number, updateFolder = false) => {
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
    },
    [onFileChange, handleNavigateToFolder],
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "ArrowLeft" || e.key === "ArrowRight")
      ) {
        e.preventDefault()

        if (!currentFile || currentFiles.length === 0) return

        const currentIndex = currentFiles.findIndex(
          (f) => f.path === currentFile,
        )
        if (currentIndex === -1) return

        let newIndex: number
        if (e.key === "ArrowLeft") {
          newIndex =
            currentIndex === 0 ? currentFiles.length - 1 : currentIndex - 1
        } else {
          newIndex =
            currentIndex === currentFiles.length - 1 ? 0 : currentIndex + 1
        }

        const newFile = currentFiles[newIndex]
        if (newFile) {
          selectFile(newFile.path, newIndex)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentFile, currentFiles, selectFile])

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

  // Show recently viewed files (from localStorage)
  const recentFiles = useMemo(() => {
    if (!showRecents) return []
    return recentlyViewedFiles
      .filter((file) => filteredFiles.includes(file))
      .slice(0, 3)
  }, [showRecents, recentlyViewedFiles, filteredFiles])

  // Show recently saved files (from FILE_UPDATED events) - up to 3
  const recentlySavedFiles = useMemo(() => {
    if (!showRecents) return []

    const savedFiles: string[] = []
    // Iterate from most recent to oldest
    for (let i = recentEvents.length - 1; i >= 0; i--) {
      const event = recentEvents[i]
      if (
        event.event_type === "FILE_UPDATED" &&
        filteredFiles.includes(event.file_path) &&
        !savedFiles.includes(event.file_path)
      ) {
        savedFiles.push(event.file_path)
        if (savedFiles.length >= 3) break
      }
    }

    return savedFiles
  }, [showRecents, recentEvents, filteredFiles])

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
            <div className="rf-px-3 rf-py-2 rf-border-t rf-border-b rf-border-gray-200 rf-bg-slate-50 rf-flex rf-items-center rf-justify-between rf-gap-2">
              <div className="rf-flex rf-items-center rf-text-xs rf-text-slate-600 rf-min-w-0 rf-flex-1">
                <div className="rf-flex rf-items-center rf-min-w-0">
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
              </div>
              <div className="rf-flex rf-items-center rf-gap-2 rf-flex-shrink-0">
                {currentFolder && (
                  <button
                    onClick={navigateUp}
                    className="rf-flex rf-items-center rf-gap-1 rf-text-slate-600 hover:rf-text-slate-800 rf-bg-transparent rf-border-none rf-p-1 rf-rounded hover:rf-bg-slate-200 rf-transition-colors"
                    title="Go up one level"
                  >
                    <ArrowUp className="rf-h-3 rf-w-3" />
                    <span className="rf-text-xs rf-font-medium">Up</span>
                  </button>
                )}
              </div>
            </div>

            <CommandList className="rf-max-h-[70vh] rf-overflow-y-auto">
              {!isSearching ? (
                <>
                  <CommandEmpty>{emptyMessage}</CommandEmpty>

                  {/* Recent Files Section - Always show header if there are recent files */}
                  {recentlyViewedFiles.length > 0 && (
                    <CommandGroup
                      heading={
                        <div className="rf-flex rf-items-center rf-gap-0">
                          <span className="rf-leading-none">Recent</span>
                          <button
                            onClick={() => setShowRecents(!showRecents)}
                            className="rf-flex rf-items-center rf-justify-center rf-text-slate-600 hover:rf-text-slate-800 rf-bg-transparent rf-border-none rf-p-0 rf-w-3.5 rf-h-3.5 rf-ml-2"
                            title={
                              showRecents
                                ? "Hide recent files"
                                : "Show recent files"
                            }
                          >
                            {showRecents ? (
                              <Eye className="rf-h-3.5 rf-w-3.5" />
                            ) : (
                              <EyeOff className="rf-h-3.5 rf-w-3.5" />
                            )}
                          </button>
                        </div>
                      }
                      className="rf-border-b rf-border-gray-200 rf-pb-1 rf-bg-blue-50/30"
                    >
                      {showRecents &&
                        recentFiles.map((path, index) => (
                          <CommandItem
                            key={path}
                            value={`recent:${path}`}
                            onSelect={() => selectFile(path, index, true)}
                            className={cn(
                              path === currentFile && "rf-font-medium",
                            )}
                          >
                            <Clock className="rf-mr-2 rf-h-4 rf-w-4 rf-text-blue-500" />
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

                  {/* Recently Saved Files Section */}
                  {recentlySavedFiles.length > 0 && (
                    <CommandGroup
                      heading={"Recently Saved"}
                      className="rf-border-b rf-border-gray-200 rf-pb-1 rf-bg-green-50/30"
                    >
                      {recentlySavedFiles.map((path, index) => (
                        <CommandItem
                          key={path}
                          value={`recently-saved:${path}`}
                          onSelect={() => selectFile(path, index, true)}
                          className={cn(
                            path === currentFile && "rf-font-medium",
                          )}
                        >
                          <File className="rf-mr-2 rf-h-4 rf-w-4 rf-text-green-600" />
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
                            value={`favorite:${path}`}
                            onSelect={() => selectFile(path, index, true)}
                            className={cn(
                              path === currentFile && "rf-font-medium",
                              "rf-group",
                            )}
                          >
                            {onToggleFavorite && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onToggleFavorite(path)
                                }}
                                className="rf-mr-2 rf-p-0 rf-bg-transparent rf-border-none"
                                aria-label="Remove from favorites"
                                title="Remove from favorites"
                              >
                                <Star className="rf-h-4 rf-w-4 rf-text-amber-500 rf-fill-amber-500" />
                              </button>
                            )}
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
                          value={`current:${fileNode.path}`}
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
                                value={`search-current:${file.path}`}
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
                              value={`search-global:${file.path}`}
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
