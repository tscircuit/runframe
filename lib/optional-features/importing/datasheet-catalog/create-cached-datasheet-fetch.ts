export interface CachedDatasheetFetchOptions {
  /** Read UTF-8 cache files locally; return null for a missing file. */
  readCacheFile: (path: string) => string | null | Promise<string | null>
  cacheDirectory?: string
  apiBaseUrl?: string
}

export class DatasheetCacheMissError extends Error {
  readonly code = "DATASHEET_CACHE_MISS"

  constructor(readonly cachePath: string) {
    super(
      `Datasheet cache file is missing: ${cachePath}. No external request was attempted.`,
    )
    this.name = "DatasheetCacheMissError"
  }
}

export const normalizeDatasheetChipName = (name: string) =>
  name.replace(/[^0-9a-zA-Z_-]/g, "").toLowerCase()

/**
 * Replay read-only datasheet API requests from .cache/datasheets. There is no
 * native-fetch fallback. The host supplies filesystem or same-origin reads.
 */
export const createCachedDatasheetFetch = ({
  readCacheFile,
  cacheDirectory = ".cache/datasheets",
  apiBaseUrl = "https://api.tscircuit.com",
}: CachedDatasheetFetchOptions): typeof fetch => {
  const base = new URL(`${apiBaseUrl.replace(/\/$/, "")}/`)
  if (base.search || base.hash || base.username || base.password) {
    throw new Error(
      "Datasheet API base URL must not contain credentials, query or fragment",
    )
  }
  const directory = cacheDirectory.replace(/\/$/, "")
  const listUrl = new URL("datasheets/list", base)
  const getUrl = new URL("datasheets/get", base)
  const rejectRequest = (method: string, url: string): never => {
    throw new Error(
      `Unsupported cached datasheet request: ${method} ${url}. No external request was attempted.`,
    )
  }
  const read = async (path: string, signal?: AbortSignal | null) => {
    signal?.throwIfAborted()
    let content: string | null
    try {
      content = await readCacheFile(path)
    } catch (error) {
      if ((error as { code?: string })?.code === "ENOENT") {
        throw new DatasheetCacheMissError(path)
      }
      throw error
    }
    signal?.throwIfAborted()
    if (content === null) throw new DatasheetCacheMissError(path)
    return content
  }
  const cachedFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = input instanceof Request ? input : undefined
    const rawUrl = request?.url ?? String(input)
    const method = (init?.method ?? request?.method ?? "GET").toUpperCase()
    const signal = init && "signal" in init ? init.signal : request?.signal
    signal?.throwIfAborted()
    let url: URL
    try {
      url = new URL(rawUrl)
    } catch {
      return rejectRequest(method, rawUrl)
    }
    if (
      method !== "GET" ||
      url.origin !== base.origin ||
      url.username ||
      url.password ||
      url.hash
    ) {
      return rejectRequest(method, rawUrl)
    }
    let filePath: string
    if (url.pathname === listUrl.pathname && !url.search) {
      filePath = `${directory}/index.json`
    } else if (url.pathname === getUrl.pathname) {
      const parameters = [...url.searchParams.entries()]
      if (parameters.length !== 1) return rejectRequest(method, rawUrl)
      const [key, value] = parameters[0]
      let chipName: string
      if (key === "chip_name") {
        chipName = normalizeDatasheetChipName(value)
      } else if (key === "datasheet_id" && value) {
        const index = JSON.parse(await read(`${directory}/index.json`, signal))
        if (!Array.isArray(index?.datasheets)) {
          throw new Error(
            "Invalid cached datasheet index: expected a datasheets array",
          )
        }
        const entry = index.datasheets.find(
          (item: { datasheet_id?: unknown }) => item?.datasheet_id === value,
        )
        if (!entry || typeof entry.chip_name !== "string") {
          throw new DatasheetCacheMissError(
            `${directory}/index.json (datasheet_id=${value})`,
          )
        }
        chipName = normalizeDatasheetChipName(entry.chip_name)
      } else {
        return rejectRequest(method, rawUrl)
      }
      if (!chipName) return rejectRequest(method, rawUrl)
      filePath = `${directory}/parts/${chipName}.json`
    } else {
      return rejectRequest(method, rawUrl)
    }
    return new Response(await read(filePath, signal), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    })
  }
  return Object.assign(cachedFetch, {
    preconnect: (url: string | URL) => rejectRequest("PRECONNECT", String(url)),
  }) as typeof fetch
}
