import { afterAll, afterEach, beforeEach, expect, spyOn, test } from "bun:test"
import type { RunFrameEvent } from "../lib/components/RunFrameWithApi/types"

const originalWindow = globalThis.window
if (!originalWindow)
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: {},
  })

const {
  MAX_RECENT_EVENTS,
  mergeRecentEvents,
  useRunFrameStore: store,
} = await import("../lib/components/RunFrameWithApi/store")

const initialState = store.getState()

afterAll(() => {
  store.getState().stopPolling()
  store.setState(initialState)
  if (!originalWindow) Reflect.deleteProperty(globalThis, "window")
})

let nextPoll: (() => Promise<void>) | undefined
let fetchMock: ReturnType<typeof spyOn>
let timerMock: ReturnType<typeof spyOn>

const makeEvent = (
  id: number,
  eventType: "FILE_UPDATED" | "FILE_DELETED" = "FILE_UPDATED",
): RunFrameEvent => ({
  event_id: `event-${id}`,
  event_type: eventType,
  file_path: `file-${id}.tsx`,
  created_at: new Date(1_700_000_000_000 + id * 1_000).toISOString(),
})

const flush = async () => {
  for (let i = 0; i < 40; i++) await Promise.resolve()
}

const pollOnce = async () => {
  const scheduled = nextPoll
  nextPoll = undefined
  expect(scheduled).toBeDefined()
  await scheduled!()
  await flush()
}

const emptyList = () => Response.json({ event_list: [] })

beforeEach(() => {
  store.setState({
    ...initialState,
    fsMap: new Map(),
    recentEvents: [],
    recentlySavedFiles: [],
    lastEventTime: new Date(0).toISOString(),
    error: null,
    isPolling: false,
  })
  nextPoll = undefined
  timerMock = spyOn(globalThis, "setTimeout").mockImplementation(((
    callback: () => Promise<void>,
  ) => {
    nextPoll = callback
    return 1
  }) as typeof setTimeout)
  fetchMock = spyOn(globalThis, "fetch")
})

afterEach(() => {
  store.getState().stopPolling()
  timerMock.mockRestore()
  fetchMock.mockRestore()
})

test("clears the disconnect error once polling succeeds again", async () => {
  fetchMock.mockRejectedValueOnce(new Error("dev server down"))
  store.getState().startPolling()
  await flush()
  expect(store.getState().error?.message).toBe("dev server down")

  fetchMock.mockImplementation(async () => emptyList())
  await pollOnce()
  // Empty batches count as a successful poll: the status dot turns green
  // again without a page reload.
  expect(store.getState().error).toBeNull()
})

test("an empty batch clears a pre-existing stale error", async () => {
  store.setState({ error: new Error("stale") })
  fetchMock.mockImplementation(async () => emptyList())
  store.getState().startPolling()
  await flush()
  expect(store.getState().error).toBeNull()
  await pollOnce()
  expect(store.getState().error).toBeNull()
})

test("keeps the newest events and always exposes the latest at index 0", async () => {
  const firstBatch = [makeEvent(1), makeEvent(2)]
  const secondBatch = [makeEvent(3), makeEvent(4)]

  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes("/events/list")) {
      return Response.json({
        event_list:
          store.getState().recentEvents.length === 0 ? firstBatch : secondBatch,
      })
    }
    const path = decodeURIComponent(url.split("file_path=")[1] ?? "")
    return Response.json({
      file: { file_id: path, file_path: path, text_content: "content" },
    })
  })

  store.getState().startPolling()
  await flush()
  expect(store.getState().recentEvents.map((e) => e.event_id)).toEqual([
    "event-2",
    "event-1",
  ])

  await pollOnce()
  expect(store.getState().recentEvents.map((e) => e.event_id)).toEqual([
    "event-4",
    "event-3",
    "event-2",
    "event-1",
  ])
})

test("recentEvents stays capped without freezing the newest event", () => {
  const total = MAX_RECENT_EVENTS + 40
  let recentEvents: RunFrameEvent[] = []
  for (let id = 0; id < total; id += 10) {
    const batch = Array.from({ length: 10 }, (_, i) => makeEvent(id + i + 1))
    recentEvents = mergeRecentEvents(recentEvents, batch)
  }

  expect(recentEvents).toHaveLength(MAX_RECENT_EVENTS)
  // Before the fix the retained window was the oldest 100 events, so
  // recentEvents[0] stopped changing and useEventHandler went quiet.
  expect(recentEvents[0].event_id).toBe(`event-${total}`)
})

test("deduplicates events that the server returns in overlapping batches", () => {
  const merged = mergeRecentEvents(
    [makeEvent(2), makeEvent(1)],
    [makeEvent(1), makeEvent(2), makeEvent(3)],
  )
  expect(merged.map((e) => e.event_id)).toEqual([
    "event-3",
    "event-2",
    "event-1",
  ])
})

test("a failed file fetch keeps the cursor so the batch is retried", async () => {
  const events = [makeEvent(1), makeEvent(2)]
  store.setState({ fsMap: new Map([["file-2.tsx", "original"]]) })
  const cursor = store.getState().lastEventTime
  let failFileFetch = true

  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes("/events/list")) {
      return Response.json({ event_list: events })
    }
    const path = decodeURIComponent(url.split("file_path=")[1] ?? "")
    if (path === "file-2.tsx" && failFileFetch) {
      return new Response("boom", { status: 500 })
    }
    return Response.json({
      file: { file_id: path, file_path: path, text_content: `body of ${path}` },
    })
  })

  store.getState().startPolling()
  await flush()
  expect(store.getState().error).not.toBeNull()
  expect(store.getState().lastEventTime).toBe(cursor)
  expect(store.getState().recentEvents).toHaveLength(0)
  expect(store.getState().fsMap.get("file-2.tsx")).toBe("original")

  failFileFetch = false
  await pollOnce()
  expect(store.getState().error).toBeNull()
  expect(store.getState().recentEvents.map((e) => e.event_id)).toEqual([
    "event-2",
    "event-1",
  ])
  expect(store.getState().fsMap.get("file-1.tsx")).toBe("body of file-1.tsx")
  expect(store.getState().fsMap.get("file-2.tsx")).toBe("body of file-2.tsx")
})

test("a file deleted between the event and the fetch is removed, not retried", async () => {
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes("/events/list")) {
      return Response.json({ event_list: [makeEvent(1)] })
    }
    return new Response("not found", { status: 404 })
  })

  store.setState({ fsMap: new Map([["file-1.tsx", "stale"]]) })
  store.getState().startPolling()
  await flush()
  expect(store.getState().error).toBeNull()
  expect(store.getState().fsMap.has("file-1.tsx")).toBe(false)
})

test("a local edit made during the batch is not overwritten by the batch", async () => {
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes("/events/list")) {
      return Response.json({ event_list: [makeEvent(1)] })
    }
    if (url.includes("/files/upsert")) {
      return Response.json({
        file: {
          file_id: "local.tsx",
          file_path: "local.tsx",
          text_content: "edited locally",
        },
      })
    }
    // The local save lands while this fetch is in flight.
    void store.getState().upsertFile("local.tsx", "edited locally")
    return Response.json({
      file: {
        file_id: "file-1.tsx",
        file_path: "file-1.tsx",
        text_content: "from server",
      },
    })
  })

  store.setState({ fsMap: new Map([["local.tsx", "old local"]]) })
  store.getState().startPolling()
  await flush()

  expect(store.getState().fsMap.get("file-1.tsx")).toBe("from server")
  expect(store.getState().fsMap.get("local.tsx")).toBe("edited locally")
})

test("stopPolling cancels the pending tick", async () => {
  fetchMock.mockImplementation(async () => emptyList())
  store.getState().startPolling()
  await flush()
  expect(nextPoll).toBeDefined()

  store.getState().stopPolling()
  expect(store.getState().isPolling).toBe(false)
  await flush()

  const callsAfterStop = fetchMock.mock.calls.length
  await pollOnce().catch(() => undefined)
  expect(fetchMock.mock.calls.length).toBe(callsAfterStop)
})
