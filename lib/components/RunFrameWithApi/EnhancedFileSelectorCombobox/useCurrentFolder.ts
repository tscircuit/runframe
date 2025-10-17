import { useState, useEffect } from "react"

function getDirectoryPath(filePath: string): string {
  const lastSlashIndex = filePath.lastIndexOf("/")
  if (lastSlashIndex === -1) return "/"
  return filePath.substring(0, lastSlashIndex)
}

export function useCurrentFolder({
  currentFile,
  files,
}: {
  currentFile: string
  files: string[]
}) {
  const [hasManuallyNavigated, setHasManuallyNavigated] = useState(false)
  const [currentFolder, setCurrentFolder] = useState<string | null>(() => {
    // Initialize to the folder of the current file
    // First check if there's a file in the URL (search params or hash)
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.slice(1))
      const urlFile = searchParams.get("file") ?? hashParams.get("file")
      if (urlFile && files.includes(urlFile)) {
        const fileDir = getDirectoryPath(urlFile)
        return fileDir === "/" ? null : fileDir
      }
    }
    // Fall back to currentFile prop
    if (currentFile && files.includes(currentFile)) {
      const fileDir = getDirectoryPath(currentFile)
      return fileDir === "/" ? null : fileDir
    }
    return null
  })

  useEffect(() => {
    // Only auto-sync folder if user hasn't manually navigated and file exists
    if (currentFile && !hasManuallyNavigated && files.includes(currentFile)) {
      const fileDir = getDirectoryPath(currentFile)
      setCurrentFolder(fileDir === "/" ? null : fileDir)
    }
  }, [currentFile, hasManuallyNavigated, files])

  const navigateToFolder = (folderPath: string | null) => {
    setCurrentFolder(folderPath)
    setHasManuallyNavigated(true)
  }

  const resetManualNavigation = () => {
    setHasManuallyNavigated(false)
  }

  return {
    currentFolder,
    navigateToFolder,
    resetManualNavigation,
  }
}
