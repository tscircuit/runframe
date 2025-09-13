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
      // Reset events
      fetch("/api/events/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      // Create a simple file structure similar to example05 but with different components
      const filesToCreate = [
        {
          path: "main.tsx",
          content: `import manualEdits from "./manual-edits.json"

export default () => (
  <board width="15mm" height="15mm" manualEdits={manualEdits}>
    <led name="LED1" color="red" pcbX={2} pcbY={2} />
    <resistor name="R1" resistance="220" footprint="0603" pcbX={5} pcbY={2} />
    <trace from=".LED1 .pin1" to=".R1 .pin1" />
  </board>
)`,
        },
        {
          path: "manual-edits.json",
          content: JSON.stringify({}),
        },
        {
          path: "board.circuit.tsx",
          content: `export default () => (
  <board width="20mm" height="20mm">
    <capacitor name="C1" capacitance="10uF" footprint="0805" pcbX={3} pcbY={3} />
    <diode name="D1" footprint="SOD123" pcbX={6} pcbY={3} />
    <trace from=".C1 .pin1" to=".D1 .pin1" />
  </board>
)`,
        },
        {
          path: "index.tsx",
          content: `export default () => (
  <board width="12mm" height="12mm">
    <transistor name="Q1" footprint="TO-92" pcbX={4} pcbY={4} />
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={7} pcbY={4} />
    <trace from=".Q1 .pin1" to=".R1 .pin1" />
  </board>
)`,
        },
        {
          path: "entrypoint.tsx",
          content: `export default () => (
  <board width="18mm" height="18mm">
    <ic name="U1" footprint="DIP-8" pcbX={2} pcbY={2} />
    <capacitor name="C1" capacitance="100nF" footprint="0603" pcbX={5} pcbY={2} />
    <trace from=".U1 .pin1" to=".C1 .pin1" />
  </board>
)`,
        },
        {
          path: "manual-edit.json",
          content: JSON.stringify({ alternative: true }),
        },
        {
          path: "app.tsx",
          content: `export default () => (
  <board width="25mm" height="25mm">
    <led name="LED1" color="blue" pcbX={3} pcbY={3} />
    <led name="LED2" color="green" pcbX={6} pcbY={3} />
    <resistor name="R1" resistance="330" footprint="0805" pcbX={9} pcbY={3} />
    <trace from=".LED1 .pin1" to=".R1 .pin1" />
    <trace from=".LED2 .pin1" to=".R1 .pin1" />
  </board>
)`,
        },
        {
          path: "src/index.tsx",
          content: `export default () => (
  <board width="8mm" height="8mm">
    <crystal name="XTAL1" frequency="16MHz" footprint="HC49" pcbX={2} pcbY={2} />
    <capacitor name="C1" capacitance="22pF" footprint="0603" pcbX={4} pcbY={2} />
    <trace from=".XTAL1 .pin1" to=".C1 .pin1" />
  </board>
)`,
        },
      ]

      // Create all files
      for (const file of filesToCreate) {
        await fetch("/api/files/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_path: file.path,
            text_content: file.content,
          }),
        })
      }
    }, 500)
  }, [])

  if (!isFileApiAccessible()) {
    return (
      <div>
        <h1>Enhanced File Selector Test</h1>
        <p>
          We don't currently deploy the API to vercel, try locally! The vite
          plugin will automatically load it.
        </p>
      </div>
    )
  }

  return (
    <>
      <RunFrameWithApi
        debug
        showFilesSwitch={true}
        useEnhancedFileSelector={true}
      />
    </>
  )
}
