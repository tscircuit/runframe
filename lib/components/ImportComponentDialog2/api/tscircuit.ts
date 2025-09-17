import type { Package } from "@tscircuit/fake-snippets/schema"
import type { ComponentSearchResult } from "../types"

interface SearchResponse {
  packages: Package[]
}

export const searchTscircuitPackages = async (
  query: string,
): Promise<Package[]> => {
  const response = await fetch(
    "https://registry-api.tscircuit.com/packages/search",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  )

  if (!response.ok) {
    throw new Error(`tscircuit registry error: ${response.status}`)
  }

  const data: SearchResponse = await response.json()
  return data.packages ?? []
}

export const mapTscircuitPackageToSearchResult = (
  pkg: Package,
): ComponentSearchResult => ({
  id: `tscircuit-${pkg.package_id}`,
  name: pkg.unscoped_name,
  description: pkg.description || `Component by ${pkg.owner_github_username}`,
  source: "tscircuit.com",
  partNumber: pkg.name,
  owner: String(pkg.owner_github_username ?? ""),
})
