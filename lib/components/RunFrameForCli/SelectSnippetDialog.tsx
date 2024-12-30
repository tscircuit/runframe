import { useState } from "react"

interface SelectSnippetDialogProps {
  snippetNames: string[]
  onSelect: (name: string) => void
  onCancel: () => void
  isOpen: boolean
}

export const SelectSnippetDialog = ({
  snippetNames,
  onSelect,
  onCancel,
  isOpen,
}: SelectSnippetDialogProps) => {
  const [selectedName, setSelectedName] = useState<string>("")
  const [searchInput, setSearchInput] = useState("")

  if (!isOpen) return null

  const filteredSnippets = snippetNames.filter((name) =>
    name.toLowerCase().includes(searchInput.toLowerCase()),
  )

  const showCreateNew = searchInput && !snippetNames.includes(searchInput)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (filteredSnippets.length === 1) {
        setSelectedName(filteredSnippets[0])
      } else if (showCreateNew) {
        setSelectedName(searchInput)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-lg font-semibold mb-4">Select Snippet</h2>
        <input
          type="text"
          className="w-full px-4 py-2 border rounded mb-4"
          placeholder="Search snippets or new snippet name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="h-60 overflow-y-auto">
          {filteredSnippets.map((name) => (
            <button
              type="button"
              key={name}
              className={`w-full text-left px-4 py-2 rounded hover:bg-gray-100 ${
                selectedName === name ? "bg-blue-50" : ""
              }`}
              onClick={() => setSelectedName(name)}
            >
              {name}
            </button>
          ))}
          {showCreateNew && (
            <button
              type="button"
              className={`w-full text-left px-4 py-2 rounded hover:bg-gray-100 text-blue-500 ${
                selectedName === searchInput ? "bg-blue-50" : ""
              }`}
              onClick={() => setSelectedName(searchInput)}
            >
              Create new "{searchInput}"
            </button>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            onClick={() => selectedName && onSelect(selectedName)}
            disabled={!selectedName}
          >
            {selectedName === searchInput
              ? `Create "${selectedName}"`
              : `Save to ${selectedName}`}
          </button>
        </div>
      </div>
    </div>
  )
}
