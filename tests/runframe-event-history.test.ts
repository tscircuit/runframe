import { afterEach, beforeEach, expect, spyOn, test } from "bun:test"

const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: { TSCIRCUIT_FILESERVER_API_BASE_URL: "/api" },
})
const { useRunFrameStore } = await import(
  "../lib/components/RunFrameWithApi/store"
)
if (previousWindow) {
  Object.defineProperty(globalThis, "window", previousWindow)
} else {
  Reflect.deleteProperty(globalThis, "window")
}

let nextPoll: () => Promise<void>
let firstPollScheduled: Promise<void>
let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, "fetch">>
let timerSpy: ReturnType<typeof spyOn<typeof globalThis, "setTimeout">>

beforeEach(() => {
  useRunFrameStore.setState(useRunFrameStore.getInitialState(), true)
  fetchSpy = spyOn(globalThis, "fetch")
  firstPollScheduled = new Promise<void>((resolve) => {
    timerSpy = spyOn(globalThis, "setTimeout").mockImplementation(((
      callback: () => Promise<void>,
    ) => {
      nextPoll = callback
      resolve()
      return 0
    }) as typeof setTimeout)
  })
})

afterEach(() => {
  useRunFrameStore.getState().stopPolling()
  fetchSpy.mockRestore()
  timerSpy.mockRestore()
})

const event = (index: number) => ({
  event_id: `event-${index}`,
  event_type: "TOKEN_UPDATED" as const,
  registry_token: `test-token-${index}`,
  created_at: new Date(Date.UTC(2026, 9, 4, 12, 0, index)).toISOString(),
})

test("polling exposes the newest event first across consecutive batches", async () => {
  fetchSpy.mockResolvedValueOnce(
    Response.json({ event_list: [event(1), event(2)] }),
  )
  useRunFrameStore.getState().startPolling()
  await firstPollScheduled
  expect(
    useRunFrameStore.getState().recentEvents.map((e) => e.event_id),
  ).toEqual(["event-2", "event-1"])

  fetchSpy.mockResolvedValueOnce(Response.json({ event_list: [event(3)] }))
  await nextPoll()
  expect(
    useRunFrameStore.getState().recentEvents.map((e) => e.event_id),
  ).toEqual(["event-3", "event-2", "event-1"])
  expect(useRunFrameStore.getState().lastEventTime).toBe(event(3).created_at)
})

test("the 100-event cap evicts old history and continues accepting new events", async () => {
  fetchSpy.mockResolvedValueOnce(
    Response.json({
      event_list: Array.from({ length: 105 }, (_, i) => event(i)),
    }),
  )
  useRunFrameStore.getState().startPolling()
  await firstPollScheduled
  const history = useRunFrameStore.getState().recentEvents
  expect(history).toHaveLength(100)
  expect(history[0].event_id).toBe("event-104")
  expect(history[99].event_id).toBe("event-5")
  expect(useRunFrameStore.getState().lastEventTime).toBe(event(104).created_at)

  fetchSpy.mockResolvedValueOnce(Response.json({ event_list: [event(105)] }))
  await nextPoll()
  expect(useRunFrameStore.getState().recentEvents).toHaveLength(100)
  expect(useRunFrameStore.getState().recentEvents[0].event_id).toBe("event-105")
  expect(useRunFrameStore.getState().recentEvents[99].event_id).toBe("event-6")
})

test("empty polls preserve existing event history and cursor", async () => {
  fetchSpy.mockResolvedValueOnce(Response.json({ event_list: [event(1)] }))
  useRunFrameStore.getState().startPolling()
  await firstPollScheduled
  const history = useRunFrameStore.getState().recentEvents

  fetchSpy.mockResolvedValueOnce(Response.json({ event_list: [] }))
  await nextPoll()
  expect(useRunFrameStore.getState().recentEvents).toBe(history)
  expect(useRunFrameStore.getState().lastEventTime).toBe(event(1).created_at)
})
