import { Button } from "../../ui/button"
import type { Package } from "@tscircuit/fake-snippets/schema"
import type {
  ImportComponentDialogSearchResult,
  TscircuitPackageSearchResult,
} from "../types"

interface SearchResultsListProps {
  results: ImportComponentDialogSearchResult[]
  selected: ImportComponentDialogSearchResult | null
  onSelect: (result: ImportComponentDialogSearchResult) => void
  onShowDetails?: (result: TscircuitPackageSearchResult) => void
}

const getResultKey = (result: ImportComponentDialogSearchResult) => {
  switch (result.source) {
    case "tscircuit.com": {
      const pkg = result.package as Package
      const identifier =
        pkg.package_id ??
        `${pkg.owner_github_username ?? "unknown"}-${
          pkg.unscoped_name ?? pkg.name ?? "package"
        }`
      return `tscircuit-${identifier}`
    }
    case "jlcpcb":
      return `jlc-${result.component.lcscId}`
    case "kicad":
      return `kicad-${result.footprint.path}`
    default:
      return "unknown"
  }
}

const getPrimaryText = (result: ImportComponentDialogSearchResult) => {
  switch (result.source) {
    case "tscircuit.com":
      return result.package.unscoped_name
    case "jlcpcb":
      return result.component.manufacturer
    case "kicad":
      return result.footprint.qualifiedName
  }
}

const getSecondaryText = (result: ImportComponentDialogSearchResult) => {
  switch (result.source) {
    case "tscircuit.com":
      return (
        result.package.description ||
        (result.package.owner_github_username
          ? `Component by ${result.package.owner_github_username}`
          : undefined)
      )
    case "jlcpcb":
      return result.component.description
    case "kicad":
      return result.footprint.description
  }
}

const getPartNumberLabel = (result: ImportComponentDialogSearchResult) => {
  switch (result.source) {
    case "tscircuit.com":
      return result.package.name
    case "jlcpcb":
      return result.component.partNumber
    case "kicad":
      return undefined
  }
}

export const SearchResultsList = ({
  results,
  selected,
  onSelect,
  onShowDetails,
}: SearchResultsListProps) => {
  const selectedKey = selected ? getResultKey(selected) : null

  return (
    <div className="rf-divide-y">
      {results.map((result) => {
        const key = getResultKey(result)
        const isSelected = selectedKey === key
        const primary = getPrimaryText(result)
        const secondary = getSecondaryText(result)
        const partNumber = getPartNumberLabel(result)
        const stock = result.source === "jlcpcb" ? result.component.stock : null

        return (
          <div
            key={key}
            className={`rf-p-3 rf-flex rf-flex-col sm:rf-grid sm:rf-grid-cols-[1fr_auto] rf-items-start sm:rf-items-center rf-cursor-pointer hover:rf-bg-zinc-100 rf-gap-2 ${isSelected ? "rf-bg-zinc-100" : ""}`}
            onClick={() => onSelect(result)}
          >
            <div className="rf-min-w-0 rf-overflow-hidden rf-w-full">
              <div className="rf-flex rf-items-start rf-gap-2">
                <div className="rf-font-medium rf-text-sm rf-truncate rf-flex-1 rf-min-w-0">
                  {primary}
                </div>
                {result.source === "jlcpcb" && stock != null ? (
                  <div className="rf-text-xs rf-text-zinc-500 rf-font-medium rf-whitespace-nowrap sm:rf-hidden">
                    {stock.toLocaleString()} in stock
                  </div>
                ) : null}
              </div>
              <div className="rf-text-xs rf-text-zinc-500 rf-truncate">
                {partNumber ? (
                  <span className="rf-mr-2">{partNumber}</span>
                ) : null}
                {secondary}
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
                    onShowDetails(result as TscircuitPackageSearchResult)
                  }}
                >
                  See Details
                </Button>
              </div>
            ) : result.source === "jlcpcb" && stock != null ? (
              <div className="rf-hidden sm:rf-block rf-text-xs rf-text-zinc-500 rf-font-medium rf-w-full sm:rf-w-auto sm:rf-text-right sm:rf-justify-self-end rf-whitespace-nowrap">
                {stock.toLocaleString()} in stock
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
