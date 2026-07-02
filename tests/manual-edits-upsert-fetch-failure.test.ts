import { afterEach, expect, mock, test } from "bun:test"

// The store transitively reads `window` (api-base + zustand devtools), so stub
// it before importing the store.
;(globalThis as any).window = globalThis

const { useRunFrameStore } = await import(
  "../lib/components/RunFrameWithApi/store"
)

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
})

// Regression test: when the local file server is briefly unreachable, saving
// manual edits used to leak an unhandled "TypeError: Failed to fetch". The save
// path must now reject with a handled error and record it on the store instead.
test("applyEditEventsAndUpdateManualEditsJson surfaces a handled error when the file server is unreachable", async () => {
  // Simulate the file server being down: fetch rejects like the browser does.
  global.fetch = mock(async () => {
    throw new TypeError("Failed to fetch")
  }) as unknown as typeof fetch

  useRunFrameStore.getState().setCircuitJson([{ type: "board" }] as any)

  let caught: unknown
  try {
    await useRunFrameStore
      .getState()
      .applyEditEventsAndUpdateManualEditsJson([])
  } catch (error) {
    caught = error
  }

  // The rejection is a clear, handled error rather than a bare "Failed to fetch".
  expect(caught).toBeInstanceOf(Error)
  expect((caught as Error).message).toContain("could not reach the file server")

  // And the failure is recorded on the store so the UI can react.
  expect(useRunFrameStore.getState().error).toBeInstanceOf(Error)
})
