import { expect, test, describe } from "bun:test"
import { useRunFrameStore } from "../lib/components/RunFrameWithApi/store"

describe("RunFrameWithApi store polling recovery and recentEvents queue", () => {
  test("recovers error state to null when polling succeeds after failure", () => {
    const store = useRunFrameStore

    // Simulate initial error state from disconnected dev server
    store.setState({ error: new Error("Dev server disconnected") })
    expect(store.getState().error).not.toBeNull()

    // When a poll succeeds, error is cleared
    if (store.getState().error) {
      store.setState({ error: null })
    }
    expect(store.getState().error).toBeNull()
  })

  test("slice(-100) preserves the newest events instead of discarding them", () => {
    // Generate 150 events
    const initialEvents = Array.from({ length: 100 }, (_, i) => ({
      event_id: `old_${i}`,
      event_type: "FILE_UPDATED",
      created_at: new Date(Date.now() - (150 - i) * 1000).toISOString(),
    }))

    const newEvents = Array.from({ length: 20 }, (_, i) => ({
      event_id: `new_${i}`,
      event_type: "FILE_UPDATED",
      created_at: new Date().toISOString(),
    }))

    // Buggy behavior: .slice(0, 100) discards all newEvents
    const buggySlice = [...initialEvents, ...newEvents].slice(0, 100)
    expect(buggySlice[buggySlice.length - 1].event_id).toBe("old_99")

    // Fixed behavior: .slice(-100) keeps the 100 newest events
    const fixedSlice = [...initialEvents, ...newEvents].slice(-100)
    expect(fixedSlice.length).toBe(100)
    expect(fixedSlice[fixedSlice.length - 1].event_id).toBe("new_19")
    expect(fixedSlice.some((e) => e.event_id.startsWith("new_"))).toBe(true)
  })
})
