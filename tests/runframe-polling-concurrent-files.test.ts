import { afterEach, beforeAll, beforeEach, expect, mock, test } from "bun:test"
import type { useRunFrameStore as Store } from "../lib/components/RunFrameWithApi/store"

let store: typeof Store
let initialState: ReturnType<typeof store.getState>
const originalFetch = globalThis.fetch
const originalSetTimeout = globalThis.setTimeout
let scheduled: () => void

beforeAll(async () => {
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window")
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} })
  try {
    store = (await import("../lib/components/RunFrameWithApi/store"))
      .useRunFrameStore
    initialState = store.getState()
  } finally {
    if (windowDescriptor)
      Object.defineProperty(globalThis, "window", windowDescriptor)
    else Reflect.deleteProperty(globalThis, "window")
  }
})

beforeEach(() => {
  store.setState(initialState, true)
  globalThis.setTimeout = ((callback: () => void) => {
    scheduled()
    return 0
  }) as unknown as typeof setTimeout
})

afterEach(() => {
  store.getState().stopPolling()
  store.setState(initialState, true)
  globalThis.fetch = originalFetch
  globalThis.setTimeout = originalSetTimeout
})

for (const delayedRequest of ["events", "file"] as const) {
  test(`polling preserves independent saves while the ${delayedRequest} request is pending`, async () => {
    let release!: () => void
    let reached!: () => void
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    const requestStarted = new Promise<void>((resolve) => {
      reached = resolve
    })
    const pollFinished = new Promise<void>((resolve) => {
      scheduled = resolve
    })
    const events = [
      {
        event_id: "1",
        event_type: "FILE_UPDATED",
        file_path: "remote.tsx",
        created_at: "2026-01-01T00:00:01.000Z",
      },
      {
        event_id: "2",
        event_type: "FILE_DELETED",
        file_path: "deleted.tsx",
        created_at: "2026-01-01T00:00:02.000Z",
      },
    ]
    store.setState({
      fsMap: new Map([
        ["existing.tsx", "before"],
        ["deleted.tsx", "remove me"],
      ]),
    })
    globalThis.fetch = mock(async (input: string, init?: RequestInit) => {
      if (input.includes("/files/upsert")) {
        return Response.json({ file: JSON.parse(init!.body as string) })
      }
      const isEvents = input.includes("/events/list")
      if ((delayedRequest === "events") === isEvents) {
        reached()
        await pending
      }
      return Response.json(
        isEvents
          ? { event_list: events }
          : {
              file: { file_path: "remote.tsx", text_content: "remote update" },
            },
      )
    }) as unknown as typeof fetch

    store.getState().startPolling()
    await requestStarted
    await store.getState().upsertFile("existing.tsx", "local update")
    await store.getState().upsertFile("new.tsx", "local addition")
    release()
    await pollFinished

    expect(store.getState().error).toBeNull()
    expect(store.getState().fsMap).toEqual(
      new Map([
        ["existing.tsx", "local update"],
        ["new.tsx", "local addition"],
        ["remote.tsx", "remote update"],
      ]),
    )
  })
}
