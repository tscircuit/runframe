import { expect, test } from "bun:test"
import { createServer } from "node:http"
import { gzipSync } from "node:zlib"
import {
  createDatasheetAiHandler,
  MAX_RELAY_BYTES,
} from "../api/datasheet-ai.js"
import { createDatasheetRelayFetch } from "../examples/assets/datasheet-relay-fetch"
import { generateDatasheetAssets } from "../lib/ai/generate-datasheet-assets"
import { createDatasheetModel, pdfFile } from "./fixtures/datasheet-ai"

const withRelay = async (
  upstream: typeof fetch,
  run: (url: string) => Promise<void>,
) => {
  const server = createServer(createDatasheetAiHandler(upstream))
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address() as { port: number }
  try {
    await run(`http://127.0.0.1:${address.port}`)
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}

const requestHeaders = {
  "content-type": "application/gzip",
  "x-datasheet-provider": "openai",
  "x-datasheet-path": "/v1/responses",
  authorization: "Bearer fake-test-key",
}

for (const [provider, path, credential, url] of [
  [
    "anthropic",
    "/v1/messages",
    "x-api-key",
    "https://api.anthropic.com/v1/messages",
  ],
  [
    "google",
    "/v1beta/models/gemini-test:generateContent",
    "x-goog-api-key",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent",
  ],
]) {
  test(`${provider} forwards its own credentials to the fixed provider`, async () => {
    let actual: any
    await withRelay(
      (async (url, init) => {
        actual = { url, init }
        return Response.json({})
      }) as typeof fetch,
      async (origin) => {
        const response = await fetch(`${origin}/api/datasheet-ai`, {
          method: "POST",
          headers: {
            ...requestHeaders,
            "x-datasheet-provider": provider,
            "x-datasheet-path": path,
            [credential]: "fake-key",
            "anthropic-version": "2023-06-01",
          },
          body: gzipSync("{}"),
        })
        expect(response.status).toBe(200)
      },
    )
    expect(actual.url).toBe(url)
    expect(actual.init.headers[credential]).toBe("fake-key")
    expect(actual.init.headers.authorization).toBeUndefined()
  })
}

test("same-origin HTTP relay preserves the exact SDK payload and strips unrelated headers", async () => {
  const payload = JSON.stringify({
    model: "test",
    input: "%PDF-1.7\nexact bytes",
  })
  const calls: any[] = []
  await withRelay(
    (async (url, init) => {
      calls.push({ url, init })
      return Response.json({ id: "real-http-response" })
    }) as typeof fetch,
    async (origin) => {
      const transport = createDatasheetRelayFetch("openai", origin, fetch)
      const response = await transport("https://api.openai.com/v1/responses", {
        body: payload,
        headers: {
          authorization: "Bearer fake-test-key",
          cookie: "must-not-forward",
          "user-agent": "must-not-forward",
        },
      })
      expect(await response.json()).toEqual({ id: "real-http-response" })
      expect(response.headers.get("cache-control")).toBe("no-store")
    },
  )
  expect(calls).toHaveLength(1)
  expect(calls[0].url).toBe("https://api.openai.com/v1/responses")
  expect(Buffer.from(calls[0].init.body).toString()).toBe(payload)
  expect(calls[0].init.headers).toEqual({
    "content-type": "application/json",
    authorization: "Bearer fake-test-key",
  })
  expect(calls[0].init.redirect).toBe("error")
})

for (const status of [401, 429, 500]) {
  test(`relay preserves provider ${status} and its useful error`, async () => {
    await withRelay(
      (async () =>
        Response.json(
          { error: { message: "Provider error" } },
          { status },
        )) as typeof fetch,
      async (origin) => {
        const response = await fetch(`${origin}/api/datasheet-ai`, {
          method: "POST",
          headers: requestHeaders,
          body: gzipSync("{}"),
        })
        expect(response.status).toBe(status)
        expect(await response.json()).toEqual({
          error: { message: "Provider error" },
        })
      },
    )
  })
}

test("relay rejects arbitrary targets, cross-origin requests, missing keys and malformed uploads", async () => {
  let calls = 0
  await withRelay(
    (async () => {
      calls++
      return Response.json({})
    }) as typeof fetch,
    async (origin) => {
      for (const [override, body, status] of [
        [{ "x-datasheet-path": "https://example.com/" }, gzipSync("{}"), 400],
        [{ "x-datasheet-provider": "other" }, gzipSync("{}"), 400],
        [{ origin: "https://other.example" }, gzipSync("{}"), 403],
        [{ authorization: "" }, gzipSync("{}"), 401],
        [{ "content-type": "application/json" }, "{}", 415],
        [{}, "broken gzip", 400],
        [{}, gzipSync("invalid json"), 400],
        [{}, new Uint8Array(MAX_RELAY_BYTES + 1), 413],
        [{}, gzipSync(new Uint8Array(30 * 1024 * 1024 + 1)), 413],
      ] as const) {
        const response = await fetch(`${origin}/api/datasheet-ai`, {
          method: "POST",
          headers: { ...requestHeaders, ...override },
          body,
        })
        expect(response.status).toBe(status)
      }
      expect((await fetch(`${origin}/api/datasheet-ai`)).status).toBe(405)
    },
  )
  expect(calls).toBe(0)
})

test("server and browser transport failures have useful messages without leaking keys", async () => {
  await withRelay(
    (async () => {
      throw new Error("secret fake-test-key")
    }) as typeof fetch,
    async (origin) => {
      const response = await createDatasheetRelayFetch(
        "openai",
        origin,
        fetch,
      )("https://api.openai.com/v1/responses", {
        body: "{}",
        headers: { authorization: "Bearer fake-test-key" },
      })
      expect(response.status).toBe(502)
      const text = await response.text()
      expect(text).toContain("could not reach the AI provider")
      expect(text).not.toContain("fake-test-key")
    },
  )
  await expect(
    createDatasheetRelayFetch("openai", "https://preview.test", (async () => {
      throw new TypeError("NetworkError")
    }) as typeof fetch)("https://api.openai.com/v1/responses", { body: "{}" }),
  ).rejects.toThrow("Could not reach the generation server")
})

test("relay forwards cancellation to the provider", async () => {
  let started!: () => void
  const ready = new Promise<void>((resolve) => {
    started = resolve
  })
  let stopped!: () => void
  const cancelled = new Promise<void>((resolve) => {
    stopped = resolve
  })
  await withRelay(
    (async (_url, init) => {
      started()
      await new Promise<void>((resolve) =>
        init!.signal!.addEventListener(
          "abort",
          () => {
            stopped()
            resolve()
          },
          { once: true },
        ),
      )
      throw new Error("Aborted")
    }) as typeof fetch,
    async (origin) => {
      const controller = new AbortController()
      const pending = fetch(`${origin}/api/datasheet-ai`, {
        method: "POST",
        headers: requestHeaders,
        body: gzipSync("{}"),
        signal: controller.signal,
      })
      await ready
      controller.abort()
      await expect(pending).rejects.toThrow()
      await cancelled
    },
  )
})

test("the host upload limit is enforced before any model call", async () => {
  const model = createDatasheetModel()
  await expect(
    generateDatasheetAssets({
      ai: { model, maxDatasheetBytes: 4 },
      file: pdfFile(),
    }),
  ).rejects.toThrow("or smaller")
  expect(model.doGenerateCalls).toHaveLength(0)
})
