import { gunzipSync } from "node:zlib"

// Keep below Vercel's 4.5 MB request limit, including envelope overhead.
export const MAX_RELAY_BYTES = 4_400_000
const MAX_JSON_BYTES = 30 * 1024 * 1024
const credentialHeaders = {
  openai: "authorization",
  anthropic: "x-api-key",
  google: "x-goog-api-key",
}

const header = (request, name) => {
  const value = request.headers[name]
  return Array.isArray(value) ? value[0] : value
}

const targetFor = (provider, path) => {
  if (provider === "openai" && path === "/v1/responses")
    return `https://api.openai.com${path}`
  if (provider === "anthropic" && path === "/v1/messages")
    return `https://api.anthropic.com${path}`
  if (
    provider === "google" &&
    /^\/v1beta\/models\/[a-zA-Z0-9_.-]+:generateContent$/.test(path)
  )
    return `https://generativelanguage.googleapis.com${path}`
  return null
}

const readBody = async (request) => {
  const declared = Number(header(request, "content-length"))
  if (declared > MAX_RELAY_BYTES) throw new RangeError("Upload too large")
  if (request.body !== undefined) {
    if (!Buffer.isBuffer(request.body) && typeof request.body !== "string")
      throw new Error("Expected binary upload")
    const body = Buffer.from(request.body)
    if (body.length > MAX_RELAY_BYTES) throw new RangeError("Upload too large")
    return body
  }
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_RELAY_BYTES) throw new RangeError("Upload too large")
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

/** A preview-only relay. No server credentials, arbitrary targets, storage or logging. */
export const createDatasheetAiHandler =
  (upstreamFetch = globalThis.fetch) =>
  async (request, response) => {
    const json = (status, message) => {
      response.statusCode = status
      response.setHeader("content-type", "application/json")
      response.end(JSON.stringify({ error: { message } }))
    }
    response.setHeader("cache-control", "no-store")
    if (request.method !== "POST") {
      response.setHeader("allow", "POST")
      return json(405, "Only POST is allowed.")
    }
    const origin = header(request, "origin")
    if (origin) {
      try {
        if (new URL(origin).host !== header(request, "host"))
          return json(403, "Use the generation endpoint from this website.")
      } catch {
        return json(403, "Invalid origin.")
      }
    }
    const provider = header(request, "x-datasheet-provider")
    const target = targetFor(provider, header(request, "x-datasheet-path"))
    if (!target) return json(400, "Unsupported generation endpoint.")
    const credentialName = credentialHeaders[provider]
    const credential = header(request, credentialName)
    if (!credential) return json(401, "Enter your provider API key.")
    if (header(request, "content-type") !== "application/gzip")
      return json(415, "Expected a compressed generation request.")
    let body
    try {
      body = gunzipSync(await readBody(request), {
        maxOutputLength: MAX_JSON_BYTES,
      })
      JSON.parse(body.toString("utf8"))
    } catch (error) {
      return json(
        error instanceof RangeError ? 413 : 400,
        error instanceof RangeError
          ? "The upload is too large. Use a PDF smaller than 4 MB."
          : "The generation request could not be read. Try uploading the PDF again.",
      )
    }
    const headers = {
      "content-type": "application/json",
      [credentialName]: credential,
    }
    if (provider === "anthropic") {
      headers["anthropic-version"] =
        header(request, "anthropic-version") ?? "2023-06-01"
      const beta = header(request, "anthropic-beta")
      if (beta) headers["anthropic-beta"] = beta
    }
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 180_000)
    const abort = () => {
      if (!response.writableEnded) controller.abort()
    }
    response.on("close", abort)
    try {
      const upstream = await upstreamFetch(target, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
        redirect: "error",
      })
      const result = Buffer.from(await upstream.arrayBuffer())
      if (response.destroyed) return
      response.statusCode = upstream.status
      response.setHeader(
        "content-type",
        upstream.headers.get("content-type") ?? "application/json",
      )
      response.end(result)
    } catch {
      if (!response.destroyed)
        json(
          controller.signal.aborted ? 504 : 502,
          controller.signal.aborted
            ? "The provider took too long. Try generating again."
            : "The server could not reach the AI provider. Try generating again.",
        )
    } finally {
      clearTimeout(timeout)
      response.off("close", abort)
    }
  }

export default createDatasheetAiHandler()
