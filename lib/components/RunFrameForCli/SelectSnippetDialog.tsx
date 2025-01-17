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
    <div className="rf-fixed rf-inset-0 rf-bg-black rf-bg-opacity-50 rf-flex rf-items-center rf-justify-center rf-z-[100]">
      <div className="rf-bg-white rf-rounded-lg rf-p-6 rf-w-96">
        <h2 className="rf-text-lg rf-font-semibold rf-mb-4">Select Snippet</h2>
        <input
          type="text"
          className="rf-w-full rf-px-4 rf-py-2 rf-border rf-rounded rf-mb-4"
          placeholder="Search snippets or new snippet name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="rf-h-60 rf-overflow-y-auto">
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
        <div className="rf-mt-4 rf-flex rf-justify-end rf-gap-2">
          <button
            type="button"
            className="rf-px-4 rf-py-2 rf-text-gray-600 rf-hover:text-gray-800"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rf-px-4 rf-py-2 rf-bg-blue-500 rf-text-white rf-rounded rf-hover:bg-blue-600 rf-disabled:opacity-50"
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
