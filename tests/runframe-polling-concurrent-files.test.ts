import { afterEach, beforeEach, expect, mock, test } from "bun:test"
import type { RunFrameEvent } from "../lib/components/RunFrameWithApi/types"

const loadStore = async () => {
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window")
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {},
  })
  try {
    const mod = await import("../lib/components/RunFrameWithApi/store")
    return mod.useRunFrameStore
  } finally {
    if (windowDescriptor) {
      Object.defineProperty(globalThis, "window", windowDescriptor)
    } else {
      Reflect.deleteProperty(globalThis, "window")
    }
  }
}

const store = await loadStore()
const initialState = store.getState()
const originalFetch = globalThis.fetch
const originalSetTimeout = globalThis.setTimeout
let nextScheduledPoll: (() => void) | null = null
let onPollScheduled: (() => void) | null = null

beforeEach(() => {
  store.getState().stopPolling()
  store.setState(initialState, true)
  nextScheduledPoll = null
  onPollScheduled = null
  globalThis.setTimeout = ((callback: () => void) => {
    nextScheduledPoll = callback
    onPollScheduled?.()
    return 0
  }) as unknown as typeof setTimeout
})

afterEach(() => {
  store.getState().stopPolling()
  store.setState(initialState, true)
  globalThis.fetch = originalFetch
  globalThis.setTimeout = originalSetTimeout
})

const waitForPollSchedule = () =>
  new Promise<void>((resolve) => {
    onPollScheduled = resolve
  })

for (const delayedRequest of ["events", "file"] as const) {
  test(`polling preserves independent local saves while the ${delayedRequest} request is pending`, async () => {
    let release!: () => void
    let reached!: () => void
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    const requestStarted = new Promise<void>((resolve) => {
      reached = resolve
    })
    const pollFinished = waitForPollSchedule()

    const events: RunFrameEvent[] = [
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
              file: {
                file_id: "f-remote",
                file_path: "remote.tsx",
                text_content: "remote update",
              },
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

test("polling clears stale connection error on reconnect even when event batch is empty", async () => {
  let shouldFail = true
  globalThis.fetch = mock(async () => {
    if (shouldFail) {
      throw new Error("ECONNREFUSED")
    }
    return Response.json({ event_list: [] })
  }) as unknown as typeof fetch

  const firstPoll = waitForPollSchedule()
  store.getState().startPolling()
  await firstPoll
  expect(store.getState().error?.message).toBe("ECONNREFUSED")

  shouldFail = false
  const secondPoll = waitForPollSchedule()
  nextScheduledPoll!()
  await secondPoll
  expect(store.getState().error).toBeNull()
})

test("polling retains cursor and retries batch when a file fetch fails mid-batch", async () => {
  let failSecondFile = true
  const seenSinceParams: Array<string | null> = []

  const events: RunFrameEvent[] = [
    {
      event_id: "e1",
      event_type: "FILE_UPDATED",
      file_path: "a.tsx",
      created_at: "2026-01-01T00:00:10.000Z",
    },
    {
      event_id: "e2",
      event_type: "FILE_UPDATED",
      file_path: "b.tsx",
      created_at: "2026-01-01T00:00:11.000Z",
    },
  ]

  store.setState({ lastEventTime: "2026-01-01T00:00:00.000Z" })

  globalThis.fetch = mock(async (input: string) => {
    const url = new URL(input, "http://localhost")
    if (url.pathname.endsWith("/events/list")) {
      seenSinceParams.push(url.searchParams.get("since"))
      return Response.json({ event_list: events })
    }
    const filePath = url.searchParams.get("file_path")!
    if (filePath === "b.tsx" && failSecondFile) {
      return new Response("Bad Gateway", {
        status: 502,
        statusText: "Bad Gateway",
      })
    }
    return Response.json({
      file: {
        file_id: filePath,
        file_path: filePath,
        text_content: `content:${filePath}`,
      },
    })
  }) as unknown as typeof fetch

  const firstPoll = waitForPollSchedule()
  store.getState().startPolling()
  await firstPoll

  expect(store.getState().error).not.toBeNull()
  expect(store.getState().lastEventTime).toBe("2026-01-01T00:00:00.000Z")

  failSecondFile = false
  const secondPoll = waitForPollSchedule()
  nextScheduledPoll!()
  await secondPoll

  expect(seenSinceParams).toEqual([
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
  ])
  expect(store.getState().error).toBeNull()
  expect(store.getState().lastEventTime).toBe("2026-01-01T00:00:11.000Z")
  expect(store.getState().fsMap).toEqual(
    new Map([
      ["a.tsx", "content:a.tsx"],
      ["b.tsx", "content:b.tsx"],
    ]),
  )
})

test("polling keeps newest 100 recentEvents newest-first and resyncs fsMap on INITIAL_FILES_UPLOADED", async () => {
  const manyEvents: RunFrameEvent[] = Array.from({ length: 105 }, (_, idx) => {
    const num = String(idx + 1).padStart(3, "0")
    return {
      event_id: `ev-${num}`,
      event_type: "SNIPPET_SAVED",
      created_at: `2026-01-01T00:01:${String(Math.floor(idx / 2)).padStart(2, "0")}.${String((idx % 2) * 500).padStart(3, "0")}Z`,
    }
  })

  manyEvents.push({
    event_id: "ev-init",
    event_type: "INITIAL_FILES_UPLOADED",
    file_count: 1,
    created_at: "2026-01-01T00:02:00.000Z",
  })

  store.setState({
    error: new Error("disconnected"),
    fsMap: new Map([
      ["deleted-while-down.tsx", "stale"],
      ["kept.tsx", "old"],
    ]),
  })

  globalThis.fetch = mock(async (input: string) => {
    if (input.includes("/events/list")) {
      return Response.json({ event_list: manyEvents })
    }
    if (input.includes("/files/list")) {
      return Response.json({
        file_list: [{ file_id: "1", file_path: "kept.tsx" }],
      })
    }
    if (input.includes("/files/get")) {
      return Response.json({
        file: {
          file_id: "1",
          file_path: "kept.tsx",
          text_content: "restarted-content",
        },
      })
    }
    throw new Error(`Unexpected URL: ${input}`)
  }) as unknown as typeof fetch

  const firstPoll = waitForPollSchedule()
  store.getState().startPolling()
  await firstPoll

  const state = store.getState()
  expect(state.error).toBeNull()
  expect(state.recentEvents).toHaveLength(100)
  expect(state.recentEvents[0]?.event_id).toBe("ev-init")
  expect(state.fsMap).toEqual(new Map([["kept.tsx", "restarted-content"]]))
})
