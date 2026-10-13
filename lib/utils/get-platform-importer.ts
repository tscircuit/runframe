import type { PlatformConfig } from "@tscircuit/props"
import importer, {
  getImportUrl,
  getImportUrls,
} from "@tscircuit/internal-dynamic-import"

const importBundle = async (url: string, platformFetch: typeof fetch) => {
  const response = await platformFetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load dynamic module ${url}: ${response.status}`)
  }

  // Custom endpoints must serve self-contained ESM: native import would bypass
  // platformFetch, while relative imports cannot resolve from this blob URL.
  const blobUrl = URL.createObjectURL(
    new Blob([await response.text()], { type: "text/javascript" }),
  )
  try {
    return await import(/* @vite-ignore */ blobUrl)
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

const importers = new WeakMap<
  PlatformConfig,
  {
    baseUrl: string | undefined
    platformFetch: PlatformConfig["platformFetch"]
    importer: typeof importer
  }
>()

/** Keep module promises scoped to the platform that fetched them. */
export const getPlatformImporter = (
  platformConfig?: PlatformConfig,
): typeof importer => {
  if (
    !platformConfig ||
    (platformConfig.jscdnBaseUrl === undefined && !platformConfig.platformFetch)
  ) {
    return importer
  }

  const cached = importers.get(platformConfig)
  if (
    cached &&
    cached.baseUrl === platformConfig.jscdnBaseUrl &&
    cached.platformFetch === platformConfig.platformFetch
  ) {
    return cached.importer
  }

  const hasCustomBaseUrl = platformConfig.jscdnBaseUrl !== undefined
  const baseUrl = platformConfig.jscdnBaseUrl?.replace(/\/+$/, "")
  const platformFetch = platformConfig.platformFetch ?? globalThis.fetch
  const modules = new Map<string, Promise<unknown>>()
  const platformImporter = (async (specifier: string) => {
    const cachedModule = modules.get(specifier)
    if (cachedModule) return cachedModule

    const promise = (async () => {
      // getImportUrl validates the package name and preserves version semantics.
      const defaultUrl = getImportUrl(specifier)
      const urls = hasCustomBaseUrl
        ? [defaultUrl.replace("https://jscdn.tscircuit.com", baseUrl ?? "")]
        : getImportUrls(specifier)
      let lastError: unknown
      for (const url of urls) {
        try {
          return await importBundle(url, platformFetch)
        } catch (error) {
          lastError = error
        }
      }
      throw lastError
    })()
    modules.set(specifier, promise)
    // A transient transport/import failure can be retried by the caller.
    void promise.catch(() => modules.delete(specifier))
    return promise
  }) as typeof importer

  importers.set(platformConfig, {
    baseUrl: platformConfig.jscdnBaseUrl,
    platformFetch: platformConfig.platformFetch,
    importer: platformImporter,
  })
  return platformImporter
}
