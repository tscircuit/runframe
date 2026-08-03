export interface CliLocalCacheEngine {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
}

export const createCliLocalCacheEngine = ({
  apiBaseUrl,
  fetchImpl = globalThis.fetch.bind(globalThis),
}: {
  apiBaseUrl: string
  fetchImpl?: typeof fetch
}): CliLocalCacheEngine => {
  const cacheApiUrl = `${apiBaseUrl.replace(/\/$/, "")}/cache`

  return {
    getItem: async (key) => {
      try {
        const response = await fetchImpl(
          `${cacheApiUrl}?key=${encodeURIComponent(key)}`,
        )
        if (!response.ok) return null
        return await response.text()
      } catch {
        return null
      }
    },
    setItem: async (key, value) => {
      try {
        await fetchImpl(`${cacheApiUrl}?key=${encodeURIComponent(key)}`, {
          method: "POST",
          headers: { "Content-Type": "text/plain; charset=utf-8" },
          body: value,
        })
      } catch {
        // Cache failures should not prevent a circuit from rendering.
      }
    },
  }
}
