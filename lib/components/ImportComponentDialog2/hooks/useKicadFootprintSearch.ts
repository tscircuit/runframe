import { useCallback, useState } from "react"
import { mapKicadFootprintToSummary, searchKicadFootprints } from "../api/kicad"
import type { KicadFootprintSearchResult } from "../types"

export const useKicadFootprintSearch = () => {
  const [results, setResults] = useState<KicadFootprintSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const search = useCallback(async (query: string) => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return []

    setIsSearching(true)
    setError(null)

    try {
      const footprints = await searchKicadFootprints(trimmedQuery, 20)
      const mappedResults = footprints.map((footprintPath) => ({
        source: "kicad" as const,
        footprint: mapKicadFootprintToSummary(footprintPath),
      }))
      setResults(mappedResults)
      return mappedResults
    } catch (error) {
      console.error("Error searching KiCad footprints", error)
      setResults([])
      setError(
        error instanceof Error
          ? error.message
          : "Failed to search KiCad footprints",
      )
      return []
    } finally {
      setIsSearching(false)
      setHasSearched(true)
    }
  }, [])

  const reset = useCallback(() => {
    setResults([])
    setIsSearching(false)
    setError(null)
    setHasSearched(false)
  }, [])

  return {
    results,
    isSearching,
    error,
    hasSearched,
    search,
    reset,
  }
}
