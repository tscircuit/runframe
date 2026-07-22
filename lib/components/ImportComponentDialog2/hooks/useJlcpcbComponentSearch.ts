import { useCallback, useState } from "react"
import {
  mapJlcpcbComponentToSummary,
  searchJlcpcbComponents,
} from "../api/jlcpcb"
import { addDirectJlcpcbLookupResult } from "../direct-jlcpcb-lookup"
import type { JlcpcbComponentSearchResult } from "../types"

const normalizeQuery = (query: string) => {
  const trimmedQuery = query.trim()
  const isPartNumber = /^C\d+/i.test(trimmedQuery)
  if (isPartNumber) {
    return trimmedQuery.replace(/^C/i, "")
  }
  return trimmedQuery
}

export const useJlcpcbComponentSearch = () => {
  const [results, setResults] = useState<JlcpcbComponentSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const search = useCallback(async (query: string) => {
    const normalizedQuery = normalizeQuery(query)
    if (!normalizedQuery) return []

    setIsSearching(true)
    setError(null)

    try {
      const components = await searchJlcpcbComponents(normalizedQuery, 10)
      const mappedResults = addDirectJlcpcbLookupResult(
        query,
        components.map((component) => ({
          source: "jlcpcb" as const,
          component: mapJlcpcbComponentToSummary(component),
        })),
      )
      setResults(mappedResults)
      return mappedResults
    } catch (error) {
      console.error("Error searching JLCPCB components", error)
      const directResults = addDirectJlcpcbLookupResult(query, [])
      setResults(directResults)
      setError(
        directResults.length > 0
          ? null
          : error instanceof Error
            ? error.message
            : "Failed to search JLCPCB components",
      )
      return directResults
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
