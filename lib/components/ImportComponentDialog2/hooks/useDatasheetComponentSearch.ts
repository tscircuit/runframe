import { useCallback, useRef, useState } from "react"
import type { createLocalDatasheetCatalog } from "lib/optional-features/importing/datasheet-catalog/catalog"
import type { DatasheetComponentSearchResult } from "../types"

export const useDatasheetComponentSearch = (
  catalog: ReturnType<typeof createLocalDatasheetCatalog> | null,
) => {
  const [results, setResults] = useState<DatasheetComponentSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const requestId = useRef(0)

  const reset = useCallback(() => {
    requestId.current++
    setResults([])
    setIsSearching(false)
    setError(null)
    setHasSearched(false)
  }, [])

  const search = useCallback(
    async (query: string) => {
      const currentRequest = ++requestId.current
      setResults([])
      setIsSearching(true)
      setError(null)
      try {
        if (!catalog) {
          throw new Error(
            "Cached datasheet imports require platformConfig.platformFetch",
          )
        }
        const entries = await catalog.search(query)
        const nextResults = entries.map((datasheet) => ({
          source: "datasheets" as const,
          datasheet,
        }))
        if (currentRequest === requestId.current) setResults(nextResults)
        return nextResults
      } catch (error) {
        if (currentRequest === requestId.current) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to search cached datasheets",
          )
        }
        return []
      } finally {
        if (currentRequest === requestId.current) {
          setIsSearching(false)
          setHasSearched(true)
        }
      }
    },
    [catalog],
  )

  return { results, isSearching, error, hasSearched, search, reset }
}
