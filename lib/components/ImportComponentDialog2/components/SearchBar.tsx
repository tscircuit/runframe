import * as React from "react"
import { Loader2, Search } from "lucide-react"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"

interface SearchBarProps {
  query: string
  placeholder: string
  isSearching: boolean
  onQueryChange: (value: string) => void
  onSubmit: () => void
}

export const SearchBar = ({
  query,
  placeholder,
  isSearching,
  onQueryChange,
  onSubmit,
}: SearchBarProps) => {
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault()
        onSubmit()
      }
    },
    [onSubmit],
  )

  return (
    <div className="rf-flex rf-items-center rf-gap-2 rf-mt-4">
      <div className="rf-relative rf-flex-grow">
        <Search className="rf-absolute rf-left-2 rf-top-2.5 rf-h-4 rf-w-4 rf-text-muted-foreground" />
        <Input
          placeholder={placeholder}
          className="rf-pl-8"
          spellCheck={false}
          autoComplete="off"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <Button
        onClick={onSubmit}
        disabled={isSearching || query.trim().length < 1}
        className="sm:rf-px-4 rf-px-3"
      >
        {isSearching ? (
          <Loader2 className="rf-h-4 rf-w-4 rf-animate-spin" />
        ) : (
          <>
            <Search className="rf-h-4 rf-w-4 sm:rf-hidden" />
            <span className="rf-hidden sm:rf-inline">Search</span>
          </>
        )}
      </Button>
    </div>
  )
}
