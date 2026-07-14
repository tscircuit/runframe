import { afterEach, beforeAll, describe, expect, mock, test } from "bun:test"

const originalFetch = globalThis.fetch

// The store's module reads `window` at import time (api-base.ts), so make sure
// it exists before we dynamically import the store below.
;(globalThis as any).window = (globalThis as any).window ?? {}

let pushEvent: (event: any) => Promise<void>

beforeAll(async () => {
  const { useRunFrameStore } = await import(
    "../lib/components/RunFrameWithApi/store"
  )
  pushEvent = useRunFrameStore.getState().pushEvent
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe("pushEvent", () => {
  test("does not reject when fetch rejects (no /api backend)", async () => {
    globalThis.fetch = mock(() =>
      Promise.reject(new TypeError("Failed to fetch")),
    ) as unknown as typeof fetch

    // Must resolve, never throw, regardless of caller error handling.
    await expect(
      pushEvent({
        event_type: "TOKEN_UPDATED",
        registry_token: "test-token",
      }),
    ).resolves.toBeUndefined()
  })

  test("does not reject when the response is not ok", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response("nope", { status: 500, statusText: "Server Error" }),
      ),
    ) as unknown as typeof fetch

    await expect(
      pushEvent({
        event_type: "TOKEN_UPDATED",
        registry_token: "test-token",
      }),
    ).resolves.toBeUndefined()
  })
})
