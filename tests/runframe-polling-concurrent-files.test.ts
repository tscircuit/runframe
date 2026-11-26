import { afterEach, beforeEach, expect, mock, test } from "bun:test"
import type { useRunFrameStore as Store } from "../lib/components/RunFrameWithApi/store"

let store: typeof Store | undefined
let initialState: ReturnType<typeof Store.getState> | undefined
const originalFetch = globalThis.fetch
const originalSetTimeout = globalThis.setTimeout
let onPollFinished: () => void = () => {}

async function getStore(): Promise<typeof Store> {
  if (!store) {
    const windowDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "window",
    )
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
  }
  store.setState(initialState!, true)
  return store
}

beforeEach(() => {
  if (store && initialState) {
    store.setState(initialState, true)
  }
  globalThis.setTimeout = (() => {
    onPollFinished()
    return 0
  }) as unknown as typeof setTimeout
})

afterEach(() => {
  if (store && initialState) {
    store.getState().stopPolling()
    store.setState(initialState, true)
  }
  globalThis.fetch = originalFetch
  globalThis.setTimeout = originalSetTimeout
  onPollFinished = () => {}
})

for (const pauseAt of ["events", "file"] as const) {
  test(
    `startPolling preserves concurrent local saves while ${pauseAt} request is in flight`,
    async () => {
      const s = await getStore()
      let releaseRequest!: () => void
      let markRequestStarted!: () => void
      const gate = new Promise<void>((resolve) => {
        releaseRequest = resolve
      })
      const requestStarted = new Promise<void>((resolve) => {
        markRequestStarted = resolve
      })
      const pollFinished = new Promise<void>((resolve) => {
        onPollFinished = resolve
      })

      const events = [
        {
          event_id: "evt-1",
          event_type: "FILE_UPDATED",
          file_path: "remote.tsx",
          created_at: "2026-11-24T00:00:01.000Z",
        },
        {
          event_id: "evt-2",
          event_type: "FILE_DELETED",
          file_path: "deleted.tsx",
          created_at: "2026-11-24T00:00:02.000Z",
        },
      ]

      s.setState({
        fsMap: new Map([
          ["existing.tsx", "initial content"],
          ["deleted.tsx", "to be deleted"],
        ]),
      })

      globalThis.fetch = mock(
        async (input: RequestInfo | URL, init?: RequestInit) => {
          const url = String(input)
          if (url.includes("/files/upsert")) {
            return Response.json({ file: JSON.parse(init!.body as string) })
          }
          const isEvents = url.includes("/events/list")
          if ((pauseAt === "events") === isEvents) {
            markRequestStarted()
            await gate
          }
          if (isEvents) {
            return Response.json({ event_list: events })
          }
          return Response.json({
            file: {
              file_id: "f-remote",
              file_path: "remote.tsx",
              text_content: "remote content",
            },
          })
        },
      ) as unknown as typeof fetch

      s.getState().startPolling()
      await requestStarted

      await s.getState().upsertFile("existing.tsx", "local updated content")
      await s.getState().upsertFile("new.tsx", "brand new local file")

      releaseRequest()
      await pollFinished

      expect(s.getState().error).toBeNull()
      expect(s.getState().fsMap).toEqual(
        new Map([
          ["existing.tsx", "local updated content"],
          ["new.tsx", "brand new local file"],
          ["remote.tsx", "remote content"],
        ]),
      )
    },
    { timeout: 60000 },
  )
}

test(
  "startPolling checks live lastManualEditsChangeSentAt after awaiting",
  async () => {
    const s = await getStore()
    let releaseFileFetch!: () => void
    let markFileFetchStarted!: () => void
    const gate = new Promise<void>((resolve) => {
      releaseFileFetch = resolve
    })
    const fileFetchStarted = new Promise<void>((resolve) => {
      markFileFetchStarted = resolve
    })
    const pollFinished = new Promise<void>((resolve) => {
      onPollFinished = resolve
    })

    s.setState({
      fsMap: new Map([["manual_edits.json", '{"local":1}']]),
      lastManualEditsChangeSentAt: 0,
    })

    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes("/events/list")) {
        return Response.json({
          event_list: [
            {
              event_id: "evt-me",
              event_type: "FILE_UPDATED",
              file_path: "manual_edits.json",
              created_at: "2026-11-24T00:00:01.000Z",
            },
          ],
        })
      }
      markFileFetchStarted()
      await gate
      return Response.json({
        file: {
          file_id: "f-me",
          file_path: "manual_edits.json",
          text_content: '{"staleRemote":true}',
        },
      })
    }) as unknown as typeof fetch

    s.getState().startPolling()
    await fileFetchStarted

    // Simulate local manual edit sent while polling file fetch was in flight
    s.setState({
      lastManualEditsChangeSentAt: Date.now(),
      fsMap: new Map([["manual_edits.json", '{"local":2}']]),
    })

    releaseFileFetch()
    await pollFinished

    expect(s.getState().fsMap.get("manual_edits.json")).toBe('{"local":2}')
  },
  { timeout: 60000 },
)
