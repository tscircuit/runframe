import { afterEach, beforeAll, beforeEach, expect, test } from "bun:test"
import type { useRunFrameStore as Store } from "../lib/components/RunFrameWithApi/store"

let store: typeof Store
let initialState: ReturnType<typeof Store.getState>
const originalFetch = globalThis.fetch
const originalSetTimeout = globalThis.setTimeout

function createDeferred() {
  let resolve!: () => void
  const promise = new Promise<void>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function getRequestUrl(input: string | URL | Request): string {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.toString()
  return input.url
}

interface PollScenarioOptions {
  pauseTarget: "events" | "file"
}

async function runConcurrentSaveScenario(options: PollScenarioOptions) {
  const requestPaused = createDeferred()
  const releasePaused = createDeferred()
  const pollCycleFinished = createDeferred()

  Reflect.set(globalThis, "setTimeout", () => {
    pollCycleFinished.resolve()
    return 0
  })

  const remoteEvents = [
    {
      event_id: "evt-1",
      event_type: "FILE_UPDATED",
      file_path: "remote.tsx",
      created_at: "2026-01-01T00:00:01.000Z",
    },
    {
      event_id: "evt-2",
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

  Reflect.set(
    globalThis,
    "fetch",
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = getRequestUrl(input)
      if (url.includes("/files/upsert")) {
        const requestBody = typeof init?.body === "string" ? init.body : "{}"
        return Response.json({ file: JSON.parse(requestBody) })
      }
      const isEventsRequest = url.includes("/events/list")
      if ((options.pauseTarget === "events") === isEventsRequest) {
        requestPaused.resolve()
        await releasePaused.promise
      }
      if (isEventsRequest) {
        return Response.json({ event_list: remoteEvents })
      }
      return Response.json({
        file: {
          file_path: "remote.tsx",
          text_content: "remote update",
        },
      })
    },
  )

  store.getState().startPolling()
  await requestPaused.promise

  await store.getState().upsertFile("existing.tsx", "local update")
  await store.getState().upsertFile("new.tsx", "local addition")

  releasePaused.resolve()
  await pollCycleFinished.promise

  expect(store.getState().error).toBeNull()
  expect(store.getState().fsMap).toEqual(
    new Map([
      ["existing.tsx", "local update"],
      ["new.tsx", "local addition"],
      ["remote.tsx", "remote update"],
    ]),
  )
}

beforeAll(async () => {
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window")
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {},
  })
  try {
    store = (await import("../lib/components/RunFrameWithApi/store"))
      .useRunFrameStore
    initialState = store.getState()
  } finally {
    if (windowDescriptor) {
      Object.defineProperty(globalThis, "window", windowDescriptor)
    } else {
      Reflect.deleteProperty(globalThis, "window")
    }
  }
})

beforeEach(() => {
  store.setState(initialState, true)
})

afterEach(() => {
  store.getState().stopPolling()
  store.setState(initialState, true)
  Reflect.set(globalThis, "fetch", originalFetch)
  Reflect.set(globalThis, "setTimeout", originalSetTimeout)
})

test("polling preserves concurrent local saves while /events/list is pending", () =>
  runConcurrentSaveScenario({ pauseTarget: "events" }))

test("polling preserves concurrent local saves while /files/get is pending", () =>
  runConcurrentSaveScenario({ pauseTarget: "file" }))

test("polling reads latest lastManualEditsChangeSentAt after awaiting file fetch", async () => {
  const fileFetchPaused = createDeferred()
  const releaseFileFetch = createDeferred()
  const pollCycleFinished = createDeferred()

  Reflect.set(globalThis, "setTimeout", () => {
    pollCycleFinished.resolve()
    return 0
  })

  store.setState({
    lastManualEditsChangeSentAt: 0,
    fsMap: new Map([["manual_edits.json", '{"local":"latest"}']]),
  })

  Reflect.set(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = getRequestUrl(input)
    if (url.includes("/events/list")) {
      return Response.json({
        event_list: [
          {
            event_id: "evt-manual",
            event_type: "FILE_UPDATED",
            file_path: "manual_edits.json",
            created_at: "2026-01-01T00:00:05.000Z",
          },
        ],
      })
    }
    fileFetchPaused.resolve()
    await releaseFileFetch.promise
    return Response.json({
      file: {
        file_path: "manual_edits.json",
        text_content: '{"stale":"server"}',
      },
    })
  })

  store.getState().startPolling()
  await fileFetchPaused.promise

  store.setState({
    lastManualEditsChangeSentAt: Date.now(),
    fsMap: new Map([
      ["manual_edits.json", '{"local":"latest"}'],
      ["local-only.tsx", "kept"],
    ]),
  })

  releaseFileFetch.resolve()
  await pollCycleFinished.promise

  expect(store.getState().fsMap).toEqual(
    new Map([
      ["manual_edits.json", '{"local":"latest"}'],
      ["local-only.tsx", "kept"],
    ]),
  )
})
