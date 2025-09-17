import { useCallback, useState } from "react"
import type { TscircuitPackageDetails } from "../types"

export const useTscircuitPackageDetails = () => {
  const [details, setDetails] = useState<TscircuitPackageDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchDetails = useCallback(async (owner: string, name: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `https://registry-api.tscircuit.com/packages/get?name=${encodeURIComponent(`${owner}/${name}`)}`,
      )

      if (!response.ok) {
        throw new Error(`Failed to load package details: ${response.status}`)
      }

      const data = await response.json()
      setDetails((data as { package?: TscircuitPackageDetails }).package ?? null)
    } catch (error) {
      console.error("Failed to fetch package details", error)
      setDetails(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setDetails(null)
    setIsLoading(false)
  }, [])

  return {
    details,
    isLoading,
    fetchDetails,
    reset,
  }
}
