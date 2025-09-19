import type { Package } from "@tscircuit/fake-snippets/schema"

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
