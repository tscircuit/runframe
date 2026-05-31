/**
 * Resolve the origin to use as the `targetOrigin` argument of
 * `window.postMessage`. Using a specific origin (instead of "*") prevents the
 * message payload from leaking to any page that happens to embed the iframe.
 *
 * `iframeUrl` may be absolute (e.g. "https://runframe.tscircuit.com/iframe.html")
 * or relative (e.g. "/iframe.html"), so it is resolved against `baseUrl` before
 * extracting the origin. Returns `null` when the URL cannot be parsed, letting
 * callers decide how to handle the failure safely.
 */
export const resolveIframeTargetOrigin = (
  iframeUrl: string,
  baseUrl?: string,
): string | null => {
  try {
    return new URL(iframeUrl, baseUrl).origin
  } catch {
    return null
  }
}
