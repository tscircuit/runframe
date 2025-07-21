/**
 * tscircuit Registry API service for fetching component data from the tscircuit registry API
 */

import type { Package } from "@tscircuit/fake-snippets/schema"
import type { ComponentSearchResult } from "./ImportComponentDialog"

interface TscircuitSearchResponse {
  packages: Package[]
}

/**
 * Search for components in the tscircuit registry
 * @param query Search query string
 * @param limit Maximum number of results to return (default: 10)
 * @returns Promise with search results
 */
export const searchTscircuitComponents = async (
  query: string,
): Promise<Package[]> => {
  try {
    // Make the API request
    const response = await fetch(
      "https://registry-api.tscircuit.com/packages/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query }),
      },
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
 * @param tscircuitSnippet tscircuit component data
 * @returns Formatted component data for the UI
 */
export const mapTscircuitSnippetToSearchResult = (
  tscircuitSnippet: Package,
): ComponentSearchResult => {
  return {
    id: `tscircuit-${tscircuitSnippet.package_id}`,
    name: tscircuitSnippet.unscoped_name,
    description:
      tscircuitSnippet.description ||
      `Component by ${tscircuitSnippet.owner_github_username}`,
    source: "tscircuit.com" as const,
    partNumber: tscircuitSnippet.name,
    owner: String(tscircuitSnippet.owner_github_username),
  }
}
