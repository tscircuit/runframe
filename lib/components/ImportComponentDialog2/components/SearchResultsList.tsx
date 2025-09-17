import { Button } from "../../ui/button"
import type { ComponentSearchResult } from "../types"

interface SearchResultsListProps {
  results: ComponentSearchResult[]
  selectedId: string | null
  onSelect: (result: ComponentSearchResult) => void
  onShowDetails?: (result: ComponentSearchResult) => void
}

export const SearchResultsList = ({
  results,
  selectedId,
  onSelect,
  onShowDetails,
}: SearchResultsListProps) => {
  return (
    <div className="rf-divide-y">
      {results.map((result) => {
        const isSelected = selectedId === result.id
        return (
          <div
            key={result.id}
            className={`rf-p-3 rf-flex rf-flex-col sm:rf-grid sm:rf-grid-cols-[1fr_auto] rf-items-start sm:rf-items-center rf-cursor-pointer hover:rf-bg-zinc-100 rf-gap-2 ${isSelected ? "rf-bg-zinc-100" : ""}`}
            onClick={() => onSelect(result)}
          >
            <div className="rf-min-w-0 rf-overflow-hidden">
              <div className="rf-font-medium rf-text-sm rf-truncate">{result.name}</div>
              <div className="rf-text-xs rf-text-zinc-500 rf-truncate">
                {result.partNumber && <span className="rf-mr-2">{result.partNumber}</span>}
                {result.description}
              </div>
            </div>

            {result.source === "tscircuit.com" && onShowDetails ? (
              <div className="rf-flex rf-gap-2 rf-flex-shrink-0 rf-w-full sm:rf-w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="rf-text-xs rf-w-full sm:rf-w-auto"
                  onClick={(event) => {
                    event.stopPropagation()
                    onShowDetails(result)
                  }}
                >
                  See Details
                </Button>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
