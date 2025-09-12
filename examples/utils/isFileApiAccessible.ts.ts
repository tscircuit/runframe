/**
 * Configuration for domain validation
 * @readonly
 */
const CONFIG = {
  LOCAL_HOSTS: ["localhost", "127.0.0.1"] as const,
  PRODUCTION_DOMAINS: ["vercel.app", ".com"] as const,
} as const

/**
 * Determines if the File API should be accessible based on the current environment.
 * This function checks the current hostname and origin to determine if File API
 * operations should be allowed.
 *
 * @returns {boolean} True if File API should be accessible, false otherwise
 *
 * @example
 * ```typescript
 * try {
 *   if (isFileApiAccessible()) {
 *     // Proceed with File API operations
 *   } else {
 *     // Handle restricted environment
 *   }
 * } catch (error) {
 *   console.error('Failed to check File API accessibility:', error);
 * }
 * ```
 */
export function isFileApiAccessible(): boolean {
  try {
    if (typeof window === "undefined") {
      return false
    }

    const origin = window.location.origin
    const host = window.location.hostname

    if (
      CONFIG.LOCAL_HOSTS.includes(host as (typeof CONFIG.LOCAL_HOSTS)[number])
    ) {
      return true
    }

    if (
      CONFIG.PRODUCTION_DOMAINS.some((domain) =>
        origin.toLowerCase().includes(domain.toLowerCase()),
      )
    ) {
      return false
    }

    return false
  } catch (error) {
    console.error("[isFileApiAccessible] Error:", error)
    return false
  }
}
