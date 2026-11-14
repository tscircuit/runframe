import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import type { RunFrameAiConfig } from "../../lib/ai/RunFrameAiProvider"

export const datasheetPreviewProviders = {
  openai: {
    label: "OpenAI",
    signInUrl: "https://platform.openai.com/api-keys",
    baseUrl: "https://api.openai.com/v1",
    placeholder: "https://your-server/openai/v1",
  },
  anthropic: {
    label: "Anthropic",
    signInUrl: "https://platform.claude.com/settings/keys",
    baseUrl: "https://api.anthropic.com/v1",
    placeholder: "https://your-server/anthropic/v1",
  },
  google: {
    label: "Google Gemini",
    signInUrl: "https://aistudio.google.com/apikey",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    placeholder: "https://your-server/google/v1beta",
  },
  "openai-compatible": {
    label: "OpenAI-compatible",
    signInUrl: null,
    baseUrl: null,
    placeholder: "https://your-server/v1",
  },
} as const

export type DatasheetPreviewProvider = keyof typeof datasheetPreviewProviders

export interface DatasheetPreviewConnection {
  provider: DatasheetPreviewProvider
  proxyUrl?: string
  modelId: string
  /** User-supplied provider key, held in memory and sent only to that provider. */
  apiKey?: string
  useCustomEndpoint?: boolean
  /** Host application session token, never a provider API key. Kept in memory. */
  sessionToken?: string
}

/** Personal preview connection. Production hosts supply their authenticated model. */
export const createDatasheetPreviewAi = (
  connection: DatasheetPreviewConnection,
  options: { origin: string; fetch?: typeof globalThis.fetch },
): RunFrameAiConfig => {
  if (!Object.hasOwn(datasheetPreviewProviders, connection.provider)) {
    throw new Error("Choose an AI provider.")
  }
  if (!connection.modelId.trim()) {
    throw new Error("Enter your model ID.")
  }
  const provider = datasheetPreviewProviders[connection.provider]
  const isCustom =
    provider.baseUrl === null ||
    (connection.useCustomEndpoint ?? Boolean(connection.proxyUrl?.trim()))
  let baseURL: string
  let apiKey: string
  let headers: Record<string, string> | undefined
  if (isCustom) {
    if (!connection.proxyUrl?.trim())
      throw new Error("Enter your custom server address.")
    const url = new URL(connection.proxyUrl, options.origin)
    const isLocalhost = ["localhost", "127.0.0.1", "[::1]"].includes(
      url.hostname,
    )
    if (
      url.protocol !== "https:" &&
      !(url.protocol === "http:" && isLocalhost)
    ) {
      throw new Error("Use an HTTPS server, or localhost for development.")
    }
    if (url.username || url.password || url.search || url.hash) {
      throw new Error(
        "The server address must not contain credentials, a query or a fragment.",
      )
    }
    if (
      Object.values(datasheetPreviewProviders).some(
        (entry) =>
          entry.baseUrl && new URL(entry.baseUrl).hostname === url.hostname,
      )
    ) {
      throw new Error(
        "For a standard provider, use the API key connection instead of a custom server.",
      )
    }
    baseURL = url.href.replace(/\/+$/, "")
    // Custom servers manage their own provider key; do not forward a direct key.
    apiKey = "{REPLACE_ON_SERVER}"
    const token = connection.sessionToken?.trim()
    headers = token ? { Authorization: `Bearer ${token}` } : undefined
  } else {
    if (!connection.apiKey?.trim())
      throw new Error("Enter your provider API key.")
    baseURL = provider.baseUrl!
    apiKey = connection.apiKey.trim()
    if (connection.provider === "anthropic") {
      headers = { "anthropic-dangerous-direct-browser-access": "true" }
    }
  }
  const settings = {
    baseURL,
    apiKey,
    headers,
    fetch: ((input, init) =>
      (options.fetch ?? globalThis.fetch)(input, {
        ...init,
        credentials: isCustom ? "include" : "omit",
      })) as typeof globalThis.fetch,
  }
  const modelId = connection.modelId.trim()
  switch (connection.provider) {
    case "anthropic":
      return { model: createAnthropic(settings)(modelId) }
    case "google":
      return { model: createGoogleGenerativeAI(settings)(modelId) }
    case "openai":
      return { model: createOpenAI(settings).responses(modelId) }
    case "openai-compatible":
      return { model: createOpenAI(settings).chat(modelId) }
  }
}
