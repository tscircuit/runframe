import { RunFrameForCli } from "lib/components/RunFrameForCli/RunFrameForCli"
import { RunFrameWithApi } from "lib/components/RunFrameWithApi/RunFrameWithApi"
import { useRunFrameStore } from "lib/components/RunFrameWithApi/store"
import { useState, useEffect } from "react"
import { DebugEventsTable } from "./utils/DebugEventsTable"
import { useEventHandler } from "lib/components/RunFrameForCli/useEventHandler"
import { isFileApiAccessible } from "./utils/isFileApiAccessible.ts"

export default () => {
  const recentEvents = useRunFrameStore((state) => state.recentEvents)
  const pushEvent = useRunFrameStore((state) => state.pushEvent)

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.TSCIRCUIT_REGISTRY_API_BASE_URL = `${window.location.origin}/registry`
      window.TSCIRCUIT_REGISTRY_TOKEN =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiYWNjb3VudC0xMjM0IiwiZ2l0aHViX3VzZXJuYW1lIjoidGVzdHVzZXIiLCJzZXNzaW9uX2lkIjoic2Vzc2lvbi0xMjM0IiwidG9rZW4iOiIxMjM0In0.KvHMnB_ths0mI-f8Tj-t-OTOGRUPOEbFunima0dgMcQ"
    }
  }, [])

  useEventHandler(async (event) => {
    if (event.event_type === "REQUEST_TO_SAVE_SNIPPET") {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      if (!event.snippet_name) {
        pushEvent({
          event_type: "FAILED_TO_SAVE_SNIPPET",
          error_code: "SNIPPET_UNSET",
          available_snippet_names: [
            "my-snippet-1",
            "my-snippet-2",
            "led-driver-board",
            "555-timer",
            "my-snippet-3",
            "my-snippet-4",
            "epaper-display",
            "voltage-regulator",
            "led-matrix-9x9",
            "led-matrix-16x16",
            "led-matrix-24x24",
            "led-matrix-32x32",
            "led-matrix-40x40",
          ],
        })
      } else {
        pushEvent({
          event_type: "SNIPPET_SAVED",
        })
      }
    }
  })

  useEffect(() => {
    setTimeout(async () => {
      await fetch("/api/events/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      await fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "main.tsx",
          text_content: `
import manualEdits from "./manual-edits.json"

export default () => (
  <board width="10mm" height="10mm" manualEdits={manualEdits}>
    <resistor name="R1" resistance="1k" footprint="0402" />
    <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={4} />
    <trace from=".R1 .pin1" to=".C1 .pin1" />
  </board>
)`,
        }),
      })
      await fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "manual-edits.json",
          text_content: JSON.stringify({}),
        }),
      })
      await fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "board.circuit.tsx",
          text_content: `

export default () => (
  <board width="10mm" height="10mm"
  </board>
)`,
        }),
      })
      await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "INITIAL_FILES_UPLOADED",
          file_count: 3,
        }),
      })
    }, 500)
  }, [])

  if (!isFileApiAccessible()) {
    return (
      <div>
        <h1>RunFrame with API</h1>
        <p>
          We don't currently deploy the API to vercel, try locally! The vite
          plugin will automatically load it.
        </p>
      </div>
    )
  }

  return (
    <>
      <RunFrameForCli debug />
      <DebugEventsTable />
    </>
  )
}
