/**
 * tscircuit Registry API service for fetching component data from the tscircuit registry API
 */

interface TscircuitPackage {
  package_id: string
  latest_package_release_id: string
  unscoped_name: string
  name: string
  owner_github_username: string
  description?: string
}

interface TscircuitSearchResponse {
  packages: TscircuitPackage[]
}

/**
 * Search for components in the tscircuit registry
 * @param query Search query string
 * @returns Promise with search results
 */
export const searchTscircuitComponents = async (
  query: string,
): Promise<TscircuitPackage[]> => {
  try {
    // Encode the query parameters
    const encodedQuery = encodeURIComponent(query)

    // Make the API request
    const response = await fetch(
      `https://registry-api.tscircuit.com/packages/search?query=${encodedQuery}`,
    )

    if (!response.ok) {
      throw new Error(
        `tscircuit Registry API error: ${response.status} ${response.statusText}`,
      )
    }

    const data: TscircuitSearchResponse = await response.json()
    return data.packages || []
  } catch (error) {
    console.error("Error searching tscircuit components:", error)
    throw error
  }
}

/**
 * Map tscircuit component data to the ComponentSearchResult format used in the ImportComponentDialog
 * @param tscircuitPackage tscircuit component data
 * @returns Formatted component data for the UI
 */
export const mapTscircuitSnippetToSearchResult = (
  tscircuitPackage: TscircuitPackage,
) => {
  return {
    id: `tscircuit-${tscircuitPackage.package_id}`,
    name: tscircuitPackage.unscoped_name,
    description:
      tscircuitPackage.description ||
      `Component by ${tscircuitPackage.owner_github_username}`,
    source: "tscircuit.com" as const,
    partNumber: tscircuitPackage.name,
    // Additional tscircuit-specific properties
    owner: tscircuitPackage.owner_github_username,
  }
}
