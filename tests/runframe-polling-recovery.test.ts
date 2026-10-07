import { afterEach, beforeAll, beforeEach, expect, mock, test } from "bun:test"
import type { useRunFrameStore as RunFrameStore } from "../lib/components/RunFrameWithApi/store"

let useRunFrameStore: typeof RunFrameStore
let initialState: ReturnType<typeof useRunFrameStore.getState>
const originalFetch = globalThis.fetch
const originalSetTimeout = globalThis.setTimeout
let nextPoll: (() => Promise<void>) | undefined
let onPollScheduled: (() => void) | undefined

beforeAll(async () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
  // The API base reads its browser configuration when the store is imported.
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {},
  })
  try {
    const storeModule = await import("../lib/components/RunFrameWithApi/store")
    useRunFrameStore = storeModule.useRunFrameStore
    initialState = useRunFrameStore.getState()
  } finally {
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow)
    } else {
      Reflect.deleteProperty(globalThis, "window")
    }
  }
})

beforeEach(() => {
  useRunFrameStore.setState(initialState, true)
  nextPoll = undefined
  onPollScheduled = undefined
  globalThis.setTimeout = ((callback: () => Promise<void>) => {
    nextPoll = callback
    onPollScheduled?.()
    return 0
  }) as unknown as typeof setTimeout
})

afterEach(() => {
  useRunFrameStore.getState().stopPolling()
  useRunFrameStore.setState(initialState, true)
  globalThis.fetch = originalFetch
  globalThis.setTimeout = originalSetTimeout
})

async function startPolling() {
  const firstPoll = new Promise<void>((resolve) => {
    onPollScheduled = resolve
  })
  useRunFrameStore.getState().startPolling()
  await firstPoll
  onPollScheduled = undefined
}

async function pollAgain() {
  const poll = nextPoll
  nextPoll = undefined
  expect(poll).toBeDefined()
  await poll!()
}

test("polling recovers after disconnects even when no files have changed", async () => {
  const disconnected = new Error("dev server stopped")
  let offline = true
  const fetchMock = mock(async () => {
    if (offline) throw disconnected
    return Response.json({ event_list: [] })
  })
  globalThis.fetch = fetchMock as unknown as typeof fetch

  await startPolling()
  expect(useRunFrameStore.getState().error).toBe(disconnected)

  offline = false
  await pollAgain()
  expect(useRunFrameStore.getState().error).toBeNull()
  expect(useRunFrameStore.getState().isPolling).toBe(true)

  offline = true
  await pollAgain()
  expect(useRunFrameStore.getState().error).toBe(disconnected)

  offline = false
  await pollAgain()
  expect(useRunFrameStore.getState().error).toBeNull()
  expect(fetchMock).toHaveBeenCalledTimes(4)
})

const updatedFileEvent = {
  event_id: "1",
  event_type: "FILE_UPDATED",
  file_path: "main.tsx",
  created_at: "2026-01-01T00:00:00.000Z",
}

test("a successful poll clears the error and applies changed file contents", async () => {
  const disconnected = new Error("dev server stopped")
  let offline = true
  globalThis.fetch = mock(async (url: string) => {
    if (offline) throw disconnected
    if (url.includes("/events/list")) {
      return Response.json({ event_list: [updatedFileEvent] })
    }
    return Response.json({
      file: {
        file_id: "1",
        file_path: "main.tsx",
        text_content: "export default () => <board />",
      },
    })
  }) as unknown as typeof fetch

  await startPolling()
  expect(useRunFrameStore.getState().error).toBe(disconnected)

  offline = false
  await pollAgain()
  expect(useRunFrameStore.getState().error).toBeNull()
  expect(useRunFrameStore.getState().fsMap.get("main.tsx")).toBe(
    "export default () => <board />",
  )
})

test("an event response alone does not clear a failed file update", async () => {
  const disconnected = new Error("previous connection error")
  const fileError = new Error("file request failed")
  useRunFrameStore.setState({ error: disconnected })
  const observedErrors: Array<Error | null> = []
  const unsubscribe = useRunFrameStore.subscribe((state) => {
    observedErrors.push(state.error)
  })
  globalThis.fetch = mock(async (url: string) => {
    if (url.includes("/events/list")) {
      return Response.json({ event_list: [updatedFileEvent] })
    }
    throw fileError
  }) as unknown as typeof fetch

  try {
    await startPolling()
    expect(useRunFrameStore.getState().error).toBe(fileError)
    expect(observedErrors).not.toContain(null)
    expect(useRunFrameStore.getState().fsMap.size).toBe(0)
  } finally {
    unsubscribe()
  }
})

test("a failed file batch retries from the previous cursor without publishing partial changes", async () => {
  const previousCursor = "2025-12-31T23:59:59.000Z"
  const events = [
    updatedFileEvent,
    {
      event_id: "2",
      event_type: "FILE_DELETED",
      file_path: "removed.tsx",
      created_at: "2026-01-01T00:00:01.000Z",
    },
    {
      ...updatedFileEvent,
      event_id: "3",
      file_path: "other.tsx",
      created_at: "2026-01-01T00:00:02.000Z",
    },
  ]
  const originalFiles = new Map([
    ["main.tsx", "old main"],
    ["removed.tsx", "old removed"],
  ])
  const fileError = new Error("second file request failed")
  const requestedCursors: Array<string | null> = []
  let failFileRequest = true
  useRunFrameStore.setState({
    lastEventTime: previousCursor,
    fsMap: originalFiles,
  })
  globalThis.fetch = mock(async (input: string) => {
    const url = new URL(input, "http://localhost")
    if (url.pathname.endsWith("/events/list")) {
      const since = url.searchParams.get("since")
      requestedCursors.push(since)
      return Response.json({
        event_list: events.filter(
          (event) => !since || event.created_at > since,
        ),
      })
    }
    const filePath = url.searchParams.get("file_path")
    if (filePath === "other.tsx" && failFileRequest) throw fileError
    return Response.json({
      file: { file_path: filePath, text_content: `new ${filePath}` },
    })
  }) as unknown as typeof fetch

  await startPolling()
  expect(useRunFrameStore.getState().error).toBe(fileError)
  expect(useRunFrameStore.getState().lastEventTime).toBe(previousCursor)
  expect(useRunFrameStore.getState().recentEvents).toEqual([])
  expect(useRunFrameStore.getState().fsMap).toBe(originalFiles)
  expect(useRunFrameStore.getState().recentlySavedFiles).toEqual([])

  failFileRequest = false
  await pollAgain()
  expect(requestedCursors).toEqual([previousCursor, previousCursor])
  expect(useRunFrameStore.getState().error).toBeNull()
  expect(useRunFrameStore.getState().lastEventTime).toBe(events[2].created_at)
  expect(useRunFrameStore.getState().recentEvents).toEqual(events)
  expect(useRunFrameStore.getState().fsMap).toEqual(
    new Map([
      ["main.tsx", "new main.tsx"],
      ["other.tsx", "new other.tsx"],
    ]),
  )
  expect(useRunFrameStore.getState().recentlySavedFiles).toEqual([
    "other.tsx",
    "main.tsx",
  ])

  await pollAgain()
  expect(requestedCursors).toEqual([
    previousCursor,
    previousCursor,
    events[2].created_at,
  ])
  expect(useRunFrameStore.getState().recentEvents).toEqual(events)
})
