import { useState, useEffect } from "react"
import { EnhancedFileSelectorCombobox } from "lib/components/RunFrameWithApi/EnhancedFileSelectorCombobox"
import { useRunFrameStore } from "lib/components/RunFrameWithApi/store"
import { useStyles } from "lib/hooks/use-styles"
import { useLocalStorageState } from "lib/hooks/use-local-storage-state"

export default () => {
  useStyles()
  const [currentFile, setCurrentFile] = useState("app.tsx")
  const [favorites, setFavorites] = useLocalStorageState<string[]>(
    "runframe:example38:favorites",
    [],
  )

  // Access the store to push events
  const pushEvent = useRunFrameStore((state) => state.pushEvent)
  const recentEvents = useRunFrameStore((state) => state.recentEvents)

  const handleToggleFavorite = (filePath: string) => {
    setFavorites((prev) =>
      prev.includes(filePath)
        ? prev.filter((f) => f !== filePath)
        : [...prev, filePath],
    )
  }

  // Mock file structure
  const mockFiles = [
    "app.tsx",
    "index.ts",
    "main.tsx",
    "config.ts",
    "utils.ts",
    "components/Button.tsx",
    "components/Input.tsx",
    "components/Card.tsx",
    "pages/Home.tsx",
    "pages/About.tsx",
    "lib/helpers.ts",
    "lib/validators.ts",
  ]

  // Simulate file saves
  const simulateFileSave = async (filePath: string) => {
    // In a real scenario, this would be triggered by the CLI saving a file
    // For this demo, we'll manually push FILE_UPDATED events to the store
    const event = {
      event_type: "FILE_UPDATED" as const,
      file_path: filePath,
    }

    // Mock the event being added to recentEvents
    // In production, this happens via the polling mechanism
    useRunFrameStore.setState((state) => ({
      recentEvents: [
        ...state.recentEvents,
        {
          ...event,
          event_id: `event-${Date.now()}-${Math.random()}`,
          created_at: new Date().toISOString(),
        },
      ],
    }))
  }

  return (
    <div className="rf-h-screen rf-flex rf-flex-col rf-p-4 rf-gap-4">
      {/* File Selector */}
      <div className="rf-border rf-rounded-lg rf-p-6 rf-bg-gray-50 rf-flex rf-flex-col rf-gap-4">
        <div className="rf-flex rf-justify-center">
          <div className="rf-w-fit">
            <EnhancedFileSelectorCombobox
              files={mockFiles}
              currentFile={currentFile}
              onFileChange={setCurrentFile}
              pinnedFiles={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        </div>

        <div className="rf-text-sm rf-text-gray-600">
          <p>
            <strong>Current file:</strong> {currentFile}
          </p>
        </div>
      </div>

      {/* Controls to simulate file saves */}
      <div className="rf-border rf-rounded-lg rf-p-6 rf-bg-blue-50">
        <h3 className="rf-text-lg rf-font-semibold rf-mb-3">
          Simulate File Saves (CLI)
        </h3>
        <p className="rf-text-sm rf-text-gray-600 rf-mb-4">
          Click buttons below to simulate saving files via CLI. These files will
          appear in the "Recently Saved" section of the file selector.
        </p>
        <div className="rf-flex rf-flex-wrap rf-gap-2">
          {mockFiles.slice(0, 8).map((file) => (
            <button
              key={file}
              onClick={() => simulateFileSave(file)}
              className="rf-px-4 rf-py-2 rf-bg-blue-600 rf-text-white rf-rounded rf-text-sm hover:rf-bg-blue-700 rf-transition-colors rf-font-medium rf-border rf-border-blue-700"
            >
              💾 Save {file.split("/").pop()}
            </button>
          ))}
        </div>
      </div>

      {/* Event log */}
      <div className="rf-border rf-rounded-lg rf-p-6 rf-bg-gray-50">
        <h3 className="rf-text-lg rf-font-semibold rf-mb-3">
          Recent Events Log
        </h3>
        <div className="rf-text-sm rf-font-mono rf-space-y-1 rf-max-h-64 rf-overflow-y-auto">
          {recentEvents.length === 0 ? (
            <p className="rf-text-gray-500">No events yet. Save some files!</p>
          ) : (
            recentEvents
              .slice()
              .reverse()
              .slice(0, 10)
              .map((event, idx) => (
                <div
                  key={event.event_id}
                  className="rf-p-2 rf-bg-white rf-rounded rf-border"
                >
                  <span className="rf-text-green-600 rf-font-semibold">
                    {event.event_type}
                  </span>
                  {event.event_type === "FILE_UPDATED" && (
                    <span className="rf-ml-2 rf-text-gray-700">
                      {event.file_path}
                    </span>
                  )}
                  <span className="rf-ml-2 rf-text-xs rf-text-gray-500">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="rf-border rf-rounded-lg rf-p-6 rf-bg-yellow-50">
        <h3 className="rf-text-lg rf-font-semibold rf-mb-3">
          Feature Test Instructions
        </h3>
        <ol className="rf-list-decimal rf-list-inside rf-space-y-2 rf-text-sm">
          <li>
            Click the file selector above to see the current sections: "Recent"
            (recently viewed) and "Favorites"
          </li>
          <li>
            Click different files in the selector to populate the "Recent"
            section (these are stored in localStorage)
          </li>
          <li>
            Click the "Save" buttons below to simulate CLI file saves - these
            will trigger FILE_UPDATED events
          </li>
          <li>
            Open the file selector again to see the new "Recently Saved" section
            (green background) showing files you "saved"
          </li>
          <li>
            The "Recently Saved" section shows up to 3 most recent files saved
            via CLI
          </li>
          <li>
            The "Recent" section shows up to 3 most recent files you opened in
            the viewer
          </li>
          <li>
            These two sections are independent and can contain different files
          </li>
        </ol>
      </div>
    </div>
  )
}
