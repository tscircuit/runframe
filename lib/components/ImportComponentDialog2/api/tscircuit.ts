import type { Package } from "@tscircuit/fake-snippets/schema"

interface SearchResponse {
  packages: Package[]
}

export const searchTscircuitPackages = async (
  query: string,
  sessionToken?: string,
): Promise<Package[]> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`
  }

  const response = await fetch(
    "https://registry-api.tscircuit.com/packages/search",
    {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
    },
  )

  if (!response.ok) {
    throw new Error(`tscircuit registry error: ${response.status}`)
  }

  const data: SearchResponse = await response.json()
  return data.packages ?? []
}
