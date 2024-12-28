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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-lg font-semibold mb-4">Select Snippet</h2>
        <div className="max-h-60 overflow-y-auto">
          {snippetNames.map((name) => (
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
            Select
          </button>
        </div>
      </div>
    </div>
  )
}
