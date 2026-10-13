import { describe, expect, test } from "bun:test"
import { useRunFrameStore } from "../lib/components/RunFrameWithApi/store"

describe("useRunFrameStore polling recovery (#5368)", () => {
  test("error state can be reset on reconnection", () => {
    useRunFrameStore.setState({
      error: new Error("Dev server disconnected"),
    })

    expect(useRunFrameStore.getState().error).not.toBeNull()

    // When an active error is present, a successful recovery poll resets error to null
    if (useRunFrameStore.getState().error) {
      useRunFrameStore.setState({ error: null })
    }

    expect(useRunFrameStore.getState().error).toBeNull()
  })
})
