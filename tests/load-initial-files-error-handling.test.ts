import { afterEach, expect, test } from "bun:test"

// api-base.ts reads `window` at import time; provide a minimal stub so the
// store module can be imported in the (non-DOM) bun test environment.
;(globalThis as any).window = (globalThis as any).window ?? {}

const { useRunFrameStore } = await import(
  "../lib/components/RunFrameWithApi/store"
)

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  useRunFrameStore.setState({ error: null })
})

test("loadInitialFiles does not throw when the API is unreachable", async () => {
  // Simulate the dev/standalone API server being unreachable on boot.
  globalThis.fetch = (() =>
    Promise.reject(new TypeError("Failed to fetch"))) as typeof fetch

  const { loadInitialFiles } = useRunFrameStore.getState()

  // Previously this rejected as an unhandled promise rejection; now it should
  // resolve and stash the error in state like the other API calls do.
  await expect(loadInitialFiles()).resolves.toBeUndefined()

  const { error } = useRunFrameStore.getState()
  expect(error).toBeInstanceOf(Error)
  expect(error?.message).toBe("Failed to fetch")
})
