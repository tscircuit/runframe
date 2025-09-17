import { useCallback, useEffect, useMemo, useState } from "react"
import {
  mapJlcpcbComponentToSearchResult,
  searchJlcpcbComponents,
} from "../api/jlcpcb"
import {
  mapKicadFootprintToSearchResult,
  searchKicadFootprints,
} from "../api/kicad"
import {
  mapTscircuitPackageToSearchResult,
  searchTscircuitPackages,
} from "../api/tscircuit"
import type { ComponentSearchResult, ImportSource } from "../types"

export interface SearchState {
  query: string
  setQuery: (query: string) => void
  results: ComponentSearchResult[]
  setSelectedResult: (result: ComponentSearchResult | null) => void
  selectedResult: ComponentSearchResult | null
  isLoading: boolean
  hasSearched: boolean
  error: string | null
  performSearch: () => Promise<void>
  resetResults: () => void
}

export const useComponentSearch = (
  activeSource: ImportSource,
): SearchState => {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ComponentSearchResult[]>([])
  const [selectedResult, setSelectedResult] =
    useState<ComponentSearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedQuery = useMemo(() => query.trim(), [query])

  const performSearch = useCallback(async () => {
    if (!trimmedQuery) return

    setIsLoading(true)
    setHasSearched(true)
    setError(null)

    try {
      if (activeSource === "tscircuit.com") {
        const packages = await searchTscircuitPackages(trimmedQuery)
        setResults(packages.map(mapTscircuitPackageToSearchResult))
      } else if (activeSource === "jlcpcb") {
        const isPartNumber = /^C\d+/i.test(trimmedQuery)
        const normalizedQuery = isPartNumber
          ? trimmedQuery.replace(/^C/i, "")
          : trimmedQuery
        const components = await searchJlcpcbComponents(normalizedQuery, 10)
        setResults(components.map(mapJlcpcbComponentToSearchResult))
      } else if (activeSource === "kicad") {
        const footprints = await searchKicadFootprints(trimmedQuery, 20)
        setResults(footprints.map(mapKicadFootprintToSearchResult))
      }
    } catch (err) {
      console.error("Error searching components", err)
      setError(err instanceof Error ? err.message : "Unknown error")
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [activeSource, trimmedQuery])

  const resetResults = useCallback(() => {
    setResults([])
    setSelectedResult(null)
    setHasSearched(false)
    setError(null)
  }, [])

  useEffect(() => {
    resetResults()
  }, [activeSource, resetResults])

  return {
    query,
    setQuery,
    results,
    selectedResult,
    setSelectedResult,
    isLoading,
    hasSearched,
    error,
    performSearch,
    resetResults,
  }
}
