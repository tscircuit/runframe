export const PREVIEW_MAX_DATASHEET_BYTES = 4 * 1024 * 1024
const MAX_RELAY_BYTES = 4_400_000

/** Preserve the provider SDK payload while avoiding cross-origin PDF uploads. */
export const createDatasheetRelayFetch = (
  provider: string,
  origin: string,
  transport: typeof fetch,
): typeof fetch =>
  (async (input, init) => {
    if (typeof init?.body !== "string")
      throw new Error("The generation request could not be prepared.")
    const compressed = await new Response(
      new Blob([init.body]).stream().pipeThrough(new CompressionStream("gzip")),
    ).arrayBuffer()
    if (compressed.byteLength > MAX_RELAY_BYTES)
      throw new Error("The upload is too large. Use a PDF smaller than 4 MB.")
    const original = new Headers(init.headers)
    const headers = new Headers({
      "content-type": "application/gzip",
      "x-datasheet-provider": provider,
      "x-datasheet-path": new URL(String(input)).pathname,
    })
    for (const name of [
      "authorization",
      "x-api-key",
      "x-goog-api-key",
      "anthropic-version",
      "anthropic-beta",
    ]) {
      const value = original.get(name)
      if (value) headers.set(name, value)
    }
    try {
      return await transport(new URL("/api/datasheet-ai", origin), {
        method: "POST",
        headers,
        body: compressed,
        credentials: "same-origin",
        signal: init.signal,
      })
    } catch (error) {
      if (init.signal?.aborted) throw error
      throw new Error(
        "Could not reach the generation server. Try generating again.",
      )
    }
  }) as typeof fetch
