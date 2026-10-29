import { afterEach, describe, expect, test } from "bun:test"
;(globalThis as any).window ??= {}

const { useRunFrameStore } = await import(
  "../lib/components/RunFrameWithApi/store"
)

const originalFetch = globalThis.fetch
const originalSetTimeout = globalThis.setTimeout

afterEach(() => {
  useRunFrameStore.getState().stopPolling()
  globalThis.fetch = originalFetch
  globalThis.setTimeout = originalSetTimeout
  useRunFrameStore.setState({
    circuitJson: null,
    fsMap: new Map(),
    isLoading: false,
    error: null,
    lastEventTime: null,
    lastManualEditsChangeSentAt: 0,
    isPolling: false,
    recentEvents: [],
    recentlySavedFiles: [],
  })
})

describe("RunFrameWithApi polling concurrent updates", () => {
  test("preserves local saves that occur while poll file fetches are pending", async () => {
    let resolvePolledFileGet!: () => void
    const polledFileGetStarted = new Promise<void>((resolve) => {
      resolvePolledFileGet = resolve
    })

    let releasePolledFileGet!: () => void
    const releaseGate = new Promise<void>((resolve) => {
      releasePolledFileGet = resolve
    })

    globalThis.setTimeout = (() => 0 as any) as unknown as typeof setTimeout

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes("/events/list")) {
        return Response.json({
          event_list: [
            {
              event_id: "evt-1",
              event_type: "FILE_UPDATED",
              file_path: "polled.tsx",
              created_at: "2026-04-06T00:00:01.000Z",
            },
          ],
        })
      }

      if (url.includes("/files/get?file_path=polled.tsx")) {
        resolvePolledFileGet()
        await releaseGate
        return Response.json({
          file: {
            file_id: "file-polled",
            file_path: "polled.tsx",
            text_content: "export default 'polled'\n",
          },
        })
      }

      if (url.includes("/files/upsert")) {
        return Response.json({
          file: {
            file_id: "file-local",
            file_path: "local.tsx",
            text_content: "export default 'local'\n",
          },
        })
      }

      throw new Error(`Unexpected fetch: ${url}`)
    }) as typeof fetch

    useRunFrameStore.setState({
      fsMap: new Map([["existing.tsx", "export default 'existing'\n"]]),
      isPolling: false,
      lastEventTime: null,
    })

    useRunFrameStore.getState().startPolling()
    await polledFileGetStarted

    await useRunFrameStore
      .getState()
      .upsertFile("local.tsx", "export default 'local'\n")

    releasePolledFileGet()
    await new Promise((resolve) => originalSetTimeout(resolve, 20))

    const fsMap = useRunFrameStore.getState().fsMap
    expect(fsMap.get("existing.tsx")).toBe("export default 'existing'\n")
    expect(fsMap.get("polled.tsx")).toBe("export default 'polled'\n")
    expect(fsMap.get("local.tsx")).toBe("export default 'local'\n")
  })
})
