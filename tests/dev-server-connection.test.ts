import { afterEach, expect, mock, test } from "bun:test"
import {
  checkDevServerConnection,
  isLocalhost,
} from "../lib/hooks/use-dev-server-connection"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  mock.restore()
})

test("isLocalhost only returns true for local hosts", () => {
  expect(isLocalhost("localhost")).toBe(true)
  expect(isLocalhost("LOCALHOST")).toBe(true)
  expect(isLocalhost("127.0.0.1")).toBe(true)
  expect(isLocalhost("0.0.0.0")).toBe(false)
  expect(isLocalhost("example.com")).toBe(false)
  expect(isLocalhost(undefined)).toBe(false)
})

test("checkDevServerConnection returns true when fetch succeeds", async () => {
  const fetchMock = mock((..._args: any[]) =>
    Promise.resolve(new Response("[]", { status: 200 })),
  )

  globalThis.fetch = fetchMock as unknown as typeof fetch

  await expect(checkDevServerConnection("/api")).resolves.toBe(true)
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(fetchMock.mock.calls[0]?.[0]).toMatch(/^\/api\/events\/list\?since=/)
  expect(fetchMock.mock.calls[0]?.[1]).toEqual(
    expect.objectContaining({
      method: "GET",
      cache: "no-store",
    }),
  )
})

test("checkDevServerConnection returns true on non-2xx responses", async () => {
  globalThis.fetch = mock(() =>
    Promise.resolve(new Response("missing", { status: 404 })),
  ) as unknown as typeof fetch

  await expect(checkDevServerConnection("/api")).resolves.toBe(true)
})

test("checkDevServerConnection returns false when fetch fails", async () => {
  globalThis.fetch = mock(() =>
    Promise.reject(new Error("offline")),
  ) as unknown as typeof fetch

  await expect(checkDevServerConnection("/api")).resolves.toBe(false)
})
