import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import type { RunFrameAiConfig } from "../../lib/ai/RunFrameAiProvider"

export const datasheetPreviewProviders = {
  openai: { label: "OpenAI", placeholder: "https://your-backend/openai/v1" },
  anthropic: {
    label: "Anthropic",
    placeholder: "https://your-backend/anthropic/v1",
  },
  google: {
    label: "Google Gemini",
    placeholder: "https://your-backend/google/v1beta",
  },
  "openai-compatible": {
    label: "OpenAI-compatible",
    placeholder: "https://your-backend/v1",
  },
} as const

export type DatasheetPreviewProvider = keyof typeof datasheetPreviewProviders

export interface DatasheetPreviewConnection {
  provider: DatasheetPreviewProvider
  proxyUrl: string
  modelId: string
  /** Host application session token, never a provider API key. Kept in memory. */
  sessionToken?: string
}

/** The user chooses the provider protocol, endpoint and model. No default model. */
export const createDatasheetPreviewAi = (
  connection: DatasheetPreviewConnection,
  options: { origin: string; fetch?: typeof globalThis.fetch },
): RunFrameAiConfig => {
  if (!Object.hasOwn(datasheetPreviewProviders, connection.provider)) {
    throw new Error("Choose an AI provider.")
  }
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
  if (
    [
      "api.anthropic.com",
      "api.openai.com",
      "generativelanguage.googleapis.com",
    ].includes(url.hostname)
  ) {
    throw new Error(
      "Use your backend proxy. Provider API keys must stay on the server.",
    )
  }
  const token = connection.sessionToken?.trim()
  const settings = {
    baseURL: url.href.replace(/\/+$/, ""),
    apiKey: "{REPLACE_ON_SERVER}",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    fetch: ((input, init) =>
      (options.fetch ?? globalThis.fetch)(input, {
        ...init,
        credentials: "include",
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
