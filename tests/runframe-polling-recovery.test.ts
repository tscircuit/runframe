import { afterAll, afterEach, beforeEach, expect, spyOn, test } from "bun:test"

const originalWindow = globalThis.window
globalThis.window = { TSCIRCUIT_FILESERVER_API_BASE_URL: "/api" } as Window &
  typeof globalThis
const { useRunFrameStore } = await import(
  "../lib/components/RunFrameWithApi/store"
)

let nextPoll: (() => Promise<void>) | undefined
let firstPollFinished: Promise<void>
let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, "fetch">>
let timerSpy: ReturnType<typeof spyOn<typeof globalThis, "setTimeout">>

beforeEach(() => {
  useRunFrameStore.setState(useRunFrameStore.getInitialState(), true)
  nextPoll = undefined
  firstPollFinished = new Promise((resolve) => {
    timerSpy = spyOn(globalThis, "setTimeout").mockImplementation(
      (callback) => {
        nextPoll = callback as () => Promise<void>
        resolve()
        return 0 as unknown as ReturnType<typeof setTimeout>
      },
    )
  })
  fetchSpy = spyOn(globalThis, "fetch")
})

afterEach(() => {
  useRunFrameStore.getState().stopPolling()
  fetchSpy.mockRestore()
  timerSpy.mockRestore()
})

afterAll(() => {
  globalThis.window = originalWindow
})

test("an empty successful poll clears a disconnect, including after another outage", async () => {
  const disconnected = new Error("Connection refused")
  fetchSpy.mockRejectedValueOnce(disconnected)
  useRunFrameStore.getState().startPolling()
  await firstPollFinished
  expect(useRunFrameStore.getState().error).toBe(disconnected)

  fetchSpy.mockResolvedValueOnce(Response.json({ event_list: [] }))
  await nextPoll!()
  expect(useRunFrameStore.getState().error).toBeNull()

  fetchSpy.mockRejectedValueOnce(disconnected)
  await nextPoll!()
  expect(useRunFrameStore.getState().error).toBe(disconnected)

  fetchSpy.mockResolvedValueOnce(Response.json({ event_list: [] }))
  await nextPoll!()
  expect(useRunFrameStore.getState().error).toBeNull()
})

test("a poll clears the disconnect after loading changed files", async () => {
  useRunFrameStore.setState({ error: new Error("Connection refused") })
  fetchSpy
    .mockResolvedValueOnce(
      Response.json({
        event_list: [
          {
            event_id: "update-1",
            event_type: "FILE_UPDATED",
            file_path: "main.tsx",
            created_at: "2026-10-08T00:00:00.000Z",
          },
        ],
      }),
    )
    .mockResolvedValueOnce(
      Response.json({
        file: {
          file_id: "main",
          file_path: "main.tsx",
          text_content: "updated",
        },
      }),
    )

  useRunFrameStore.getState().startPolling()
  await firstPollFinished
  expect(useRunFrameStore.getState().fsMap.get("main.tsx")).toBe("updated")
  expect(useRunFrameStore.getState().error).toBeNull()
})

test("a failed file request keeps the poll in an error state", async () => {
  const failedFile = new Error("File request failed")
  fetchSpy
    .mockResolvedValueOnce(
      Response.json({
        event_list: [
          {
            event_id: "update-1",
            event_type: "FILE_UPDATED",
            file_path: "main.tsx",
            created_at: "2026-10-08T00:00:00.000Z",
          },
        ],
      }),
    )
    .mockRejectedValueOnce(failedFile)

  useRunFrameStore.getState().startPolling()
  await firstPollFinished
  expect(useRunFrameStore.getState().error).toBe(failedFile)
})
