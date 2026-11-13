import { createAnthropic } from "@ai-sdk/anthropic"
import type { RunFrameAiConfig } from "../../lib/ai/RunFrameAiProvider"

export interface DatasheetPreviewConnection {
  proxyUrl: string
  modelId: string
  /** Host application session token, never a provider API key. Kept in memory. */
  sessionToken?: string
}

/** Use the same Anthropic proxy protocol as tscircuit.com's useAiApi hook. */
export const createDatasheetPreviewAi = (
  connection: DatasheetPreviewConnection,
  options: { origin: string; fetch?: typeof globalThis.fetch },
): RunFrameAiConfig => {
  if (!connection.proxyUrl.trim() || !connection.modelId.trim()) {
    throw new Error("Provide the AI proxy URL and model ID.")
  }
  const url = new URL(connection.proxyUrl, options.origin)
  const isLocalhost = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocalhost)) {
    throw new Error("Use an HTTPS AI proxy, or localhost for development.")
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      "The proxy URL must not contain credentials, a query or a fragment.",
    )
  }
  if (["api.anthropic.com", "api.openai.com"].includes(url.hostname)) {
    throw new Error(
      "Use your backend proxy. Provider API keys must stay on the server.",
    )
  }
  const token = connection.sessionToken?.trim()
  const anthropic = createAnthropic({
    baseURL: url.href.replace(/\/+$/, ""),
    apiKey: "{REPLACE_ON_SERVER}",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    fetch: ((input, init) =>
      (options.fetch ?? globalThis.fetch)(input, {
        ...init,
        credentials: "include",
      })) as typeof globalThis.fetch,
  })
  return { model: anthropic(connection.modelId.trim()) }
}
