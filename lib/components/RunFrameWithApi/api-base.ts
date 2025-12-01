export const API_BASE = window.TSCIRCUIT_FILESERVER_API_BASE_URL ?? "/api"

/**
 * Returns an absolute URL for the API base.
 * This is needed for features like footprint loading where relative URLs
 * don't work correctly (e.g., when used as projectBaseUrl in @tscircuit/eval).
 */
export const getAbsoluteApiBase = (): string => {
  const base = window.TSCIRCUIT_FILESERVER_API_BASE_URL ?? "/api"
  // If already absolute, return as-is
  if (base.startsWith("http://") || base.startsWith("https://")) {
    return base
  }
  // Convert relative URL to absolute using window.location.origin
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${base.startsWith("/") ? "" : "/"}${base}`
  }
  // Fallback to relative (shouldn't happen in browser context)
  return base
}
