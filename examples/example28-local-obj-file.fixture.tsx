import { RunFrameForCli } from "lib/components/RunFrameForCli/RunFrameForCli"
import { RunFrameWithApi } from "lib/components/RunFrameWithApi/RunFrameWithApi"
import { useRunFrameStore } from "lib/components/RunFrameWithApi/store"
import { useState, useEffect } from "react"
import { DebugEventsTable } from "./utils/DebugEventsTable.tsx"
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

  useEffect(() => {
    setTimeout(async () => {
      fetch("/api/events/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      // Upsert the 3D model file
      const modelResponse = await fetch(
        "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=a1e5e433dfbd402f854a03c19c373fbf&pn=C7428714",
      )
      const modelData = await modelResponse.arrayBuffer()
      const uint8Array = new Uint8Array(modelData)
      let binaryString = ""
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i])
      }
      const modelBase64 = btoa(binaryString)

      await fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "model.obj",
          binary_content_b64: modelBase64,
        }),
      })

      await fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "main.tsx",
          text_content: `
import objUrl from "./model.obj"

export default () => (
  <board width="20mm" height="15mm">
    <chip 
      name="U1" 
      footprint="soic8"
      cadModel={{ objUrl }}
    />
  </board>
)`,
        }),
      })
      await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "INITIAL_FILES_UPLOADED",
          file_count: 2,
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

  return <RunFrameForCli debug />
}
