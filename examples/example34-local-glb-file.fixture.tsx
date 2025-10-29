import { RunFrameForCli } from "lib/components/RunFrameForCli/RunFrameForCli"
import { useEffect } from "react"
import { isFileApiAccessible } from "./utils/isFileApiAccessible.ts"

export default () => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // To test with your local registry API on port 3100, change this to:
      window.TSCIRCUIT_REGISTRY_API_BASE_URL = `http://localhost:3100`
      window.TSCIRCUIT_REGISTRY_TOKEN = "Add-your-token-here"
    }
  }, [])

  useEffect(() => {
    setTimeout(async () => {
      fetch("/api/events/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      // Upsert a 3D GLB model file
      // Using a small sample GLB file from a public CDN
      const modelResponse = await fetch(
        "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb",
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
          file_path: "model.glb",
          binary_content_b64: modelBase64,
        }),
      })

      await fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "main.tsx",
          text_content: `
import glbUrl from "./model.glb"

export default () => (
  <board width="20mm" height="15mm">
    <chip
      name="U1"
      footprint="soic8"
      cadModel={{ glbUrl }}
    />
  </board>
)`,
        }),
      })

      await fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "package.json",
          text_content: JSON.stringify(
            {
              name: "glb-model-test",
              version: "1.0.0",
              description: "Testing GLB file upload in bug reports",
            },
            null,
            2,
          ),
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
        <h1>RunFrame with API - GLB File Test</h1>
        <p>
          We don't currently deploy the API to vercel, try locally! The vite
          plugin will automatically load it.
        </p>
      </div>
    )
  }

  return <RunFrameForCli debug />
}
