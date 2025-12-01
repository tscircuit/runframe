import { useState, useEffect } from "react"
import { EnhancedFileSelectorCombobox } from "lib/components/RunFrameWithApi/EnhancedFileSelectorCombobox"
import { useStyles } from "lib/hooks/use-styles"
import { useLocalStorageState } from "lib/hooks/use-local-storage-state"

/**
 * This fixture tests the "Recently Saved Files" feature in the file selector.
 * It mocks the save functionality by simulating FILE_UPDATED events
 * and demonstrates how saved files are prioritized in the Recent Files section.
 */
export default () => {
  useStyles()
  const [currentFile, setCurrentFile] = useState("main.tsx")
  const [recentlySavedFiles, setRecentlySavedFiles] = useState<string[]>([])
  const [favorites, setFavorites] = useLocalStorageState<string[]>(
    "runframe:example38-favorites",
    [],
  )
  const [saveLog, setSaveLog] = useState<
    Array<{ file: string; timestamp: Date }>
  >([])

  // Mock file structure
  const mockFiles = [
    "main.tsx",
    "index.ts",
    "components/Button.tsx",
    "components/Header.tsx",
    "components/Footer.tsx",
    "components/ui/Select.tsx",
    "components/ui/Input.tsx",
    "pages/Home.tsx",
    "pages/About.tsx",
    "pages/Contact.tsx",
    "utils/helpers.ts",
    "utils/api.ts",
    "config/settings.json",
  ]

  const handleToggleFavorite = (filePath: string) => {
    setFavorites((prev) =>
      prev.includes(filePath)
        ? prev.filter((f) => f !== filePath)
        : [...prev, filePath],
    )
  }

  // Simulate saving a file (mocks FILE_UPDATED event)
  const handleSaveFile = (filePath: string) => {
    setRecentlySavedFiles((prev) => {
      const filtered = prev.filter((f) => f !== filePath)
      return [filePath, ...filtered].slice(0, 10)
    })
    setSaveLog((prev) => [{ file: filePath, timestamp: new Date() }, ...prev])
  }

  // Simulate saving the current file
  const handleSaveCurrentFile = () => {
    if (currentFile) {
      handleSaveFile(currentFile)
    }
  }

  // Simulate random file saves for testing
  const handleSimulateRandomSave = () => {
    const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)]
    handleSaveFile(randomFile)
  }

  return (
    <div className="rf-min-h-screen rf-bg-gradient-to-br rf-from-slate-50 rf-to-blue-50 rf-p-8">
      <div className="rf-max-w-4xl rf-mx-auto">
        <h1 className="rf-text-2xl rf-font-bold rf-mb-2 rf-text-center">
          Recently Saved Files Demo
        </h1>
        <p className="rf-text-sm rf-text-muted-foreground rf-text-center rf-mb-8">
          Test the combined "Recent Files" section with saved (green save icon)
          and viewed (blue clock icon) files
        </p>

        {/* File Selector */}
        <div className="rf-flex rf-justify-center rf-mb-8">
          <EnhancedFileSelectorCombobox
            files={mockFiles}
            currentFile={currentFile}
            onFileChange={setCurrentFile}
            pinnedFiles={favorites}
            onToggleFavorite={handleToggleFavorite}
            recentlySavedFiles={recentlySavedFiles}
            placeholder="Select a file..."
            searchPlaceholder="Search files..."
          />
        </div>

        {/* Current File Info */}
        <div className="rf-bg-white rf-rounded-lg rf-shadow-sm rf-p-4 rf-mb-6">
          <div className="rf-flex rf-items-center rf-justify-between">
            <div>
              <span className="rf-text-sm rf-text-muted-foreground">
                Current file:
              </span>
              <span className="rf-ml-2 rf-font-mono rf-text-sm rf-bg-slate-100 rf-px-2 rf-py-1 rf-rounded">
                {currentFile || "(none)"}
              </span>
            </div>
            <button
              onClick={handleSaveCurrentFile}
              disabled={!currentFile}
              className="rf-px-4 rf-py-2 rf-bg-green-600 rf-text-white rf-rounded-md rf-text-sm rf-font-medium hover:rf-bg-green-700 disabled:rf-opacity-50 disabled:rf-cursor-not-allowed rf-transition-colors"
            >
              💾 Save Current File
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="rf-flex rf-gap-4 rf-mb-6">
          <button
            onClick={handleSimulateRandomSave}
            className="rf-flex-1 rf-px-4 rf-py-3 rf-bg-blue-600 rf-text-white rf-rounded-md rf-text-sm rf-font-medium hover:rf-bg-blue-700 rf-transition-colors"
          >
            🎲 Simulate Random File Save
          </button>
          <button
            onClick={() => {
              setRecentlySavedFiles([])
              setSaveLog([])
            }}
            className="rf-px-4 rf-py-3 rf-bg-slate-200 rf-text-slate-700 rf-rounded-md rf-text-sm rf-font-medium hover:rf-bg-slate-300 rf-transition-colors"
          >
            🗑️ Clear Saved Files
          </button>
        </div>

        {/* Recently Saved Files List */}
        <div className="rf-grid rf-grid-cols-2 rf-gap-6">
          <div className="rf-bg-white rf-rounded-lg rf-shadow-sm rf-p-4">
            <h2 className="rf-text-sm rf-font-semibold rf-mb-3 rf-text-slate-700">
              📁 Recently Saved Files (State)
            </h2>
            {recentlySavedFiles.length === 0 ? (
              <p className="rf-text-sm rf-text-muted-foreground rf-italic">
                No files saved yet. Click "Save Current File" or "Simulate
                Random Save"
              </p>
            ) : (
              <ul className="rf-space-y-1">
                {recentlySavedFiles.map((file, index) => (
                  <li
                    key={file}
                    className="rf-text-sm rf-font-mono rf-bg-green-50 rf-px-2 rf-py-1 rf-rounded rf-flex rf-items-center rf-gap-2"
                  >
                    <span className="rf-text-green-600 rf-font-bold">
                      {index + 1}.
                    </span>
                    <span className="rf-truncate">{file}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rf-bg-white rf-rounded-lg rf-shadow-sm rf-p-4">
            <h2 className="rf-text-sm rf-font-semibold rf-mb-3 rf-text-slate-700">
              📜 Save Log (with timestamps)
            </h2>
            {saveLog.length === 0 ? (
              <p className="rf-text-sm rf-text-muted-foreground rf-italic">
                No save events yet
              </p>
            ) : (
              <ul className="rf-space-y-1 rf-max-h-48 rf-overflow-y-auto">
                {saveLog.map((entry, index) => (
                  <li
                    key={`${entry.file}-${entry.timestamp.getTime()}`}
                    className="rf-text-xs rf-font-mono rf-bg-slate-50 rf-px-2 rf-py-1 rf-rounded rf-flex rf-justify-between"
                  >
                    <span className="rf-truncate rf-flex-1">{entry.file}</span>
                    <span className="rf-text-muted-foreground rf-ml-2">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="rf-mt-8 rf-bg-blue-50 rf-border rf-border-blue-200 rf-rounded-lg rf-p-4">
          <h3 className="rf-text-sm rf-font-semibold rf-text-blue-800 rf-mb-2">
            How to test:
          </h3>
          <ol className="rf-text-sm rf-text-blue-700 rf-space-y-1 rf-list-decimal rf-list-inside">
            <li>
              Click the file selector dropdown to see the "Recent Files" section
            </li>
            <li>
              Navigate to different files - they'll appear with a{" "}
              <span className="rf-text-blue-600 rf-font-bold">
                blue clock icon
              </span>{" "}
              (recently viewed)
            </li>
            <li>Click "Save Current File" to simulate saving a file</li>
            <li>
              Open the dropdown again - saved files appear with a{" "}
              <span className="rf-text-green-600 rf-font-bold">
                green save icon
              </span>{" "}
              (prioritized at top)
            </li>
            <li>
              The "Recent Files" section shows: 1 saved file + 2 viewed files
              (max 3 total)
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
