import { useCallback, useState } from "react"
import { searchTscircuitPackages } from "../api/tscircuit"
import type { TscircuitPackageSearchResult } from "../types"

export const useTscircuitPackageSearch = () => {
  const [results, setResults] = useState<TscircuitPackageSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const search = useCallback(async (query: string) => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return []

    setIsSearching(true)
    setError(null)

    try {
      const packages = await searchTscircuitPackages(trimmedQuery)
      const mappedResults = packages.map((pkg) => ({
        source: "tscircuit.com" as const,
        package: pkg,
      }))
      setResults(mappedResults)
      return mappedResults
    } catch (error) {
      console.error("Error searching tscircuit packages", error)
      setResults([])
      setError(
        error instanceof Error
          ? error.message
          : "Failed to search tscircuit packages",
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
