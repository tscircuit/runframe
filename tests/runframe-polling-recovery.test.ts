import { afterAll, afterEach, beforeEach, expect, spyOn, test } from "bun:test"
import type { RunFrameEvent } from "../lib/components/RunFrameWithApi/types"

const originalWindow = globalThis.window
if (!originalWindow)
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: {},
  })
const { useRunFrameStore: store } = await import(
  "../lib/components/RunFrameWithApi/store"
)
const initialState = store.getState()
afterAll(() => {
  store.setState(initialState)
  if (!originalWindow) Reflect.deleteProperty(globalThis, "window")
})
let nextPoll: (() => Promise<void>) | undefined
let fetchMock: ReturnType<typeof spyOn>
let timerMock: ReturnType<typeof spyOn>

const event = (
  id: number,
  event_type: "FILE_UPDATED" | "FILE_DELETED" = "FILE_UPDATED",
): RunFrameEvent => ({
  event_id: String(id),
  event_type,
  file_path: `${id}.tsx`,
  created_at: new Date(1700000000000 + id * 1000).toISOString(),
})
const flush = async () => {
  for (let i = 0; i < 30; i++) await Promise.resolve()
}
const poll = async () => {
  await nextPoll!()
  await flush()
}

beforeEach(() => {
  store.setState({
    ...initialState,
    fsMap: new Map(),
    recentEvents: [],
    recentlySavedFiles: [],
    error: null,
  })
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

test("clears disconnect errors after empty successful polls, repeatedly", async () => {
  fetchMock
    .mockRejectedValueOnce(new Error("offline"))
    .mockImplementation(async () =>
      Response.json({ event_list: [], file_list: [] }),
    )
  store.getState().startPolling()
  await flush()
  expect(store.getState().error?.message).toBe("offline")
  await poll()
  expect(store.getState().error).toBeNull()
  fetchMock.mockRejectedValueOnce(new Error("offline again"))
  await poll()
  expect(store.getState().error?.message).toBe("offline again")
  fetchMock.mockImplementation(async () =>
    Response.json({ event_list: [], file_list: [] }),
  )
  await poll()
  expect(store.getState().error).toBeNull()
})

test("failed file batches preserve the cursor, files and history until retry succeeds", async () => {
  const events = [event(1), event(2, "FILE_DELETED"), event(3)]
  store.setState({
    fsMap: new Map([["2.tsx", "old"]]),
    error: new Error("offline"),
  })
  const cursor = store.getState().lastEventTime
  let fail = true
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes("/events/list"))
      return Response.json({ event_list: events })
    if (url.endsWith("3.tsx") && fail) throw new Error("file unavailable")
    return Response.json({
      file: {
        file_path: url.endsWith("1.tsx") ? "1.tsx" : "3.tsx",
        text_content: "new",
      },
    })
  })
  store.getState().startPolling()
  await flush()
  expect(store.getState().error?.message).toBe("file unavailable")
  expect(store.getState().lastEventTime).toBe(cursor)
  expect([...store.getState().fsMap]).toEqual([["2.tsx", "old"]])
  expect(store.getState().recentEvents).toEqual([])
  expect(store.getState().recentlySavedFiles).toEqual([])
  fail = false
  await poll()
  expect(store.getState().error).toBeNull()
  expect([...store.getState().fsMap]).toEqual([
    ["1.tsx", "new"],
    ["3.tsx", "new"],
  ])
  expect(store.getState().lastEventTime).toBe(events[2].created_at)
  expect(store.getState().recentEvents.map((e) => e.event_id)).toEqual([
    "3",
    "2",
    "1",
  ])
})

test("keeps newest 100 events with newest first across consecutive batches", async () => {
  const events = Array.from({ length: 101 }, (_, i) => event(i, "FILE_DELETED"))
  fetchMock
    .mockResolvedValueOnce(Response.json({ event_list: events.slice(0, 50) }))
    .mockResolvedValueOnce(Response.json({ event_list: events.slice(50) }))
    .mockImplementation(async () => Response.json({ event_list: [] }))
  store.getState().startPolling()
  await flush()
  await poll()
  expect(store.getState().recentEvents).toHaveLength(100)
  expect(store.getState().recentEvents[0].event_id).toBe("100")
  expect(store.getState().recentEvents[99].event_id).toBe("1")
  const recentEvents = store.getState().recentEvents
  await poll()
  expect(store.getState().recentEvents).toEqual(recentEvents)
})

test("does not erase independent local saves made while a file fetch is pending", async () => {
  let resolveFile!: (response: Response) => void
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    if (String(input).includes("/events/list"))
      return Response.json({ event_list: [event(1)] })
    return new Promise<Response>((resolve) => {
      resolveFile = resolve
    })
  })
  store.getState().startPolling()
  await flush()
  store.setState({ fsMap: new Map([["local.tsx", "saved while polling"]]) })
  resolveFile(
    Response.json({ file: { file_path: "1.tsx", text_content: "remote" } }),
  )
  await flush()
  expect(store.getState().fsMap.get("local.tsx")).toBe("saved while polling")
  expect(store.getState().fsMap.get("1.tsx")).toBe("remote")
})

test("HTTP errors do not clear the error or consume the batch", async () => {
  fetchMock.mockResolvedValue(
    Response.json({ event_list: [] }, { status: 503 }),
  )
  const cursor = store.getState().lastEventTime
  store.getState().startPolling()
  await flush()
  expect(store.getState().error).toBeInstanceOf(Error)
  expect(store.getState().lastEventTime).toBe(cursor)
})

test("reconnect resynchronizes offline deletions and keeps local saves during resync", async () => {
  store.setState({
    fsMap: new Map([
      ["removed.tsx", "old"],
      ["kept.tsx", "old"],
    ]),
  })
  let resolveFile!: (response: Response) => void
  fetchMock
    .mockRejectedValueOnce(new Error("offline"))
    .mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes("/events/list")) return Response.json({ event_list: [] })
      if (url.includes("/files/list"))
        return Response.json({
          file_list: [{ file_path: "kept.tsx" }, { file_path: "logo.png" }],
        })
      return new Promise<Response>((resolve) => {
        resolveFile = resolve
      })
    })
  store.getState().startPolling()
  await flush()
  const recovery = nextPoll!()
  await flush()
  store.setState({
    fsMap: new Map([...store.getState().fsMap, ["local.tsx", "saved"]]),
  })
  resolveFile(
    Response.json({
      file: { file_path: "kept.tsx", text_content: "updated offline" },
    }),
  )
  await recovery
  expect(store.getState().error).toBeNull()
  expect(store.getState().fsMap.has("removed.tsx")).toBe(false)
  expect(store.getState().fsMap.get("kept.tsx")).toBe("updated offline")
  expect(store.getState().fsMap.get("local.tsx")).toBe("saved")
  expect(store.getState().fsMap.get("logo.png")).toBe("__STATIC_ASSET__")
})

test("failed resynchronization remains disconnected and retries the full snapshot", async () => {
  store.setState({ fsMap: new Map([["local.tsx", "old"]]) })
  let failResync = true
  fetchMock
    .mockRejectedValueOnce(new Error("offline"))
    .mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input).includes("/events/list"))
        return Response.json({ event_list: [] })
      if (failResync) throw new Error("snapshot unavailable")
      return Response.json({ file_list: [] })
    })
  store.getState().startPolling()
  await flush()
  await poll()
  expect(store.getState().error?.message).toBe("snapshot unavailable")
  expect(store.getState().fsMap.get("local.tsx")).toBe("old")
  failResync = false
  await poll()
  expect(store.getState().error).toBeNull()
  expect(store.getState().fsMap.size).toBe(0)
})

test("a reconnect snapshot takes precedence over older deletion events", async () => {
  fetchMock
    .mockRejectedValueOnce(new Error("offline"))
    .mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes("/events/list"))
        return Response.json({ event_list: [event(1, "FILE_DELETED")] })
      if (url.includes("/files/list"))
        return Response.json({ file_list: [{ file_path: "1.tsx" }] })
      return Response.json({
        file: { file_path: "1.tsx", text_content: "recreated after the event" },
      })
    })
  store.getState().startPolling()
  await flush()
  await poll()
  expect(store.getState().error).toBeNull()
  expect(store.getState().fsMap.get("1.tsx")).toBe("recreated after the event")
})
