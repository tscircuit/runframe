import { RunFrameWithApi } from "lib/components/RunFrameWithApi/RunFrameWithApi"
import { useEffect } from "react"
import { isFileApiAccessible } from "./utils/isFileApiAccessible.ts"

export default () => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.TSCIRCUIT_REGISTRY_API_BASE_URL = `${window.location.origin}/registry`
      window.TSCIRCUIT_REGISTRY_TOKEN =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiYWNjb3VudC0xMjM0IiwiZ2l0aHViX3VzZXJuYW1lIjoidGVzdHVzZXIiLCJzZXNzaW9uX2lkIjoic2Vzc2lvbi0xMjM0IiwidG9rZW4iOiIxMjM0In0.KvHMnB_ths0mI-f8Tj-t-OTOGRUPOEbFunima0dgMcQ"
      window.__TSCIRCUIT_LAST_EXECUTION_ERROR =
        "TypeError: Cannot read properties of undefined (reading 'map')\n    at CircuitBoard.render (circuit.tsx:15:22)"
    }
  }, [])

  useEffect(() => {
    const setupFiles = async () => {
      await fetch("/api/events/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const files = [
        {
          path: "main.tsx",
          content: `export default () => <board width="10mm" height="10mm"><resistor name="R1" resistance="1k" footprint="0402" /></board>`,
        },
        {
          path: "components/led.tsx",
          content: `export const Led = () => <chip name="LED1" footprint="0603" />`,
        },
        {
          path: "components/capacitor.tsx",
          content: `export const Cap = () => <capacitor name="C1" capacitance="100nF" footprint="0402" />`,
        },
        {
          path: "utils/helpers.ts",
          content: `export const delay = (ms: number) => new Promise(r => setTimeout(r, ms))`,
        },
        {
          path: "config.json",
          content: JSON.stringify({ boardWidth: 50, boardHeight: 30 }),
        },
        { path: "manual-edits.json", content: JSON.stringify({}) },
        {
          path: "README.md",
          content: "# My Circuit Project\n\nA simple LED driver board.",
        },
        { path: "styles.css", content: ".board { background: #1a1a2e; }" },
      ]

      for (const file of files) {
        await fetch("/api/files/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_path: file.path,
            text_content: file.content,
          }),
        })
      }

      await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "INITIAL_FILES_UPLOADED",
          file_count: files.length,
        }),
      })
    }

    setTimeout(setupFiles, 300)
  }, [])

  if (!isFileApiAccessible()) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-2">Bug Report Dialog Test</h1>
        <p className="text-gray-600">
          Run locally to test. The vite plugin will automatically load the API.
        </p>
      </div>
    )
  }

  return (
    <RunFrameWithApi
      debug
      showFilesSwitch
      showToggleFullScreen
      defaultToFullScreen={false}
    />
  )
}
