import type { RunFrameFetch } from "./types"

/** UI transport. Construct an equivalent transport inside the evaluator worker. */
export const createLocalFetch = (baseUrl?: string): RunFrameFetch => {
  const nativeFetch = globalThis.fetch.bind(globalThis)
  const base = baseUrl ?? globalThis.location?.href
  const origin = base ? new URL(base).origin : undefined

  return async (input, init) => {
    const rawUrl = input instanceof Request ? input.url : input.toString()
    const url = new URL(rawUrl, base)
    if (
      url.protocol !== "data:" &&
      !(
        (url.protocol === "blob:" || /^https?:$/.test(url.protocol)) &&
        origin &&
        url.origin === origin
      )
    ) {
      throw new Error(`Offline resource is not available locally: ${url.href}`)
    }

    // Do not follow a local redirect into a public service.
    return nativeFetch(input instanceof Request ? input : url, {
      ...init,
      redirect: "error",
    })
  }
}
