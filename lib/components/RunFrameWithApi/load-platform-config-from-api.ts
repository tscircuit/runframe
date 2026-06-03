import type { PlatformConfig } from "@tscircuit/props"

const FUNCTION_REF_KEY = "__tscircuitDevServerRpcFunction"
const BINARY_REF_KEY = "__tscircuitDevServerRpcBinary"
const RESPONSE_REF_KEY = "__tscircuitDevServerRpcResponse"
const REQUEST_REF_KEY = "__tscircuitDevServerRpcRequest"
const HEADERS_REF_KEY = "__tscircuitDevServerRpcHeaders"

const isRecord = (value: unknown): value is Record<string, any> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

const arrayBufferToBase64 = (value: ArrayBufferLike | ArrayBufferView) => {
  const bytes = ArrayBuffer.isView(value)
    ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
    : new Uint8Array(value)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

const base64ToArrayBuffer = (value: string) => {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

const headersToEntries = (headers: Headers): [string, string][] => {
  const entries: [string, string][] = []
  headers.forEach((value, key) => entries.push([key, value]))
  return entries
}

const encodeRpcValue = async (value: unknown): Promise<unknown> => {
  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value ?? null
  }

  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    return {
      [BINARY_REF_KEY]: true,
      base64: arrayBufferToBase64(value),
    }
  }

  if (value instanceof Headers) {
    return {
      [HEADERS_REF_KEY]: true,
      entries: headersToEntries(value),
    }
  }

  if (value instanceof Request) {
    const requestBody =
      value.method === "GET" || value.method === "HEAD"
        ? undefined
        : await value.clone().arrayBuffer()
    return {
      [REQUEST_REF_KEY]: true,
      url: value.url,
      method: value.method,
      headers: headersToEntries(value.headers),
      body: requestBody
        ? {
            [BINARY_REF_KEY]: true,
            base64: arrayBufferToBase64(requestBody),
          }
        : undefined,
    }
  }

  if (value instanceof Response) {
    return {
      [RESPONSE_REF_KEY]: true,
      status: value.status,
      statusText: value.statusText,
      headers: headersToEntries(value.headers),
      body: {
        [BINARY_REF_KEY]: true,
        base64: arrayBufferToBase64(await value.clone().arrayBuffer()),
      },
    }
  }

  if (Array.isArray(value)) return Promise.all(value.map(encodeRpcValue))

  if (isRecord(value)) {
    return Object.fromEntries(
      await Promise.all(
        Object.entries(value).map(async ([key, item]) => [
          key,
          await encodeRpcValue(item),
        ]),
      ),
    )
  }

  return value
}

const decodeRpcValue = (value: unknown, rpcUrl: string): any => {
  if (Array.isArray(value))
    return value.map((item) => decodeRpcValue(item, rpcUrl))
  if (!isRecord(value)) return value

  if (value[FUNCTION_REF_KEY]) {
    const target = value.target
    return async (...args: unknown[]) => {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          args: await Promise.all(args.map(encodeRpcValue)),
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(
          payload?.message ?? "Failed to call runtime platformConfig function",
        )
      }

      return decodeRpcValue(payload.result, rpcUrl)
    }
  }

  if (value[BINARY_REF_KEY]) return base64ToArrayBuffer(String(value.base64))

  if (value[HEADERS_REF_KEY]) {
    return new Headers(value.entries as [string, string][])
  }

  if (value[REQUEST_REF_KEY]) {
    return new Request(String(value.url), {
      method: String(value.method),
      headers: value.headers as [string, string][],
      body: value.body ? decodeRpcValue(value.body, rpcUrl) : undefined,
    })
  }

  if (value[RESPONSE_REF_KEY]) {
    return new Response(
      value.body ? decodeRpcValue(value.body, rpcUrl) : undefined,
      {
        status: Number(value.status),
        statusText: String(value.statusText ?? ""),
        headers: value.headers as [string, string][],
      },
    )
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      decodeRpcValue(item, rpcUrl),
    ]),
  )
}

export const loadPlatformConfigFromApi = async (
  runtimeConfigApiUrl = "/api/dev/runtime-config",
): Promise<PlatformConfig | undefined> => {
  const response = await fetch(runtimeConfigApiUrl)
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload?.message ?? "Failed to load runtime config")
  }

  if (!payload.platformConfig) return undefined

  const rpcUrl = `${runtimeConfigApiUrl.replace(/\/$/, "")}/rpc`
  return decodeRpcValue(payload.platformConfig, rpcUrl) as PlatformConfig
}
