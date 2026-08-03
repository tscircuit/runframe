import { expect, mock, test } from "bun:test"
import { createCliLocalCacheEngine } from "../lib/components/RunFrameForCli/create-cli-local-cache-engine"

test("CLI cache engine reads entries through the file-server API", async () => {
  const fetchImpl = mock(async () => new Response('{"traces":[]}'))
  const cache = createCliLocalCacheEngine({
    apiBaseUrl: "http://localhost:3020/api/",
    fetchImpl: fetchImpl as typeof fetch,
  })

  expect(await cache.getItem("routes:core@1:srj:abc 123")).toBe('{"traces":[]}')
  expect(fetchImpl).toHaveBeenCalledWith(
    "http://localhost:3020/api/cache?key=routes%3Acore%401%3Asrj%3Aabc%20123",
  )
})

test("CLI cache engine treats misses and request failures as cache misses", async () => {
  const missingCache = createCliLocalCacheEngine({
    apiBaseUrl: "/api",
    fetchImpl: mock(
      async () => new Response(null, { status: 404 }),
    ) as typeof fetch,
  })
  const unavailableCache = createCliLocalCacheEngine({
    apiBaseUrl: "/api",
    fetchImpl: mock(async () => {
      throw new Error("offline")
    }) as typeof fetch,
  })

  expect(await missingCache.getItem("missing")).toBeNull()
  expect(await unavailableCache.getItem("unavailable")).toBeNull()
})

test("CLI cache engine commits entries through the file-server API", async () => {
  const fetchImpl = mock(async () => new Response(null, { status: 204 }))
  const cache = createCliLocalCacheEngine({
    apiBaseUrl: "/api",
    fetchImpl: fetchImpl as typeof fetch,
  })

  await cache.setItem("routes:key", '{"traces":[]}')

  expect(fetchImpl).toHaveBeenCalledWith("/api/cache?key=routes%3Akey", {
    method: "POST",
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: '{"traces":[]}',
  })
})
