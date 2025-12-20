import { RunFrameForCli } from "lib/components/RunFrameForCli/RunFrameForCli"
import { useRunFrameStore } from "lib/components/RunFrameWithApi/store"
import { useEffect } from "react"
import { DebugEventsTable } from "./utils/DebugEventsTable.tsx"
import { isFileApiAccessible } from "./utils/isFileApiAccessible.ts"
import stepFileUrl from "./assets/SW_Push_1P1T_NO_CK_KMR2.step?url"

export default () => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.TSCIRCUIT_REGISTRY_API_BASE_URL = `${window.location.origin}/registry`
      window.TSCIRCUIT_REGISTRY_TOKEN =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiYWNjb3VudC0xMjM0IiwiZ2l0aHViX3VzZXJuYW1lIjoidGVzdHVzZXIiLCJzZXNzaW9uX2lkIjoic2Vzc2lvbi0xMjM0IiwidG9rZW4iOiIxMjM0In0.KvHMnB_ths0mI-f8Tj-t-OTOGRUPOEbFunima0dgMcQ"
    }
  }, [])

  useEffect(() => {
    setTimeout(async () => {
      await fetch("/api/events/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      // Fetch and upload the STEP file
      const stepResponse = await fetch(stepFileUrl)
      const stepData = await stepResponse.arrayBuffer()
      const uint8Array = new Uint8Array(stepData)
      let binaryString = ""
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i])
      }
      const stepBase64 = btoa(binaryString)

      await fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "switch.step",
          binary_content_b64: stepBase64,
        }),
      })

      await fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "main.tsx",
          text_content: `
import stepUrl from "./switch.step"

export default () => (
  <board width="20mm" height="20mm">
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
    <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={0} />
    <chip
      name="SW1"
      footprint="pushbutton"
      pcbX={5}
      cadModel={{
        stlUrl: stepUrl,
        rotationOffset: { x: 0, y: 0, z: 270 },
        positionOffset: { x: 0.5, y: -0.3, z: 0 },
      }}
    />
    <trace from=".R1 .pin2" to=".C1 .pin1" />
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
        <h1>KiCad Library Export Test</h1>
        <p>
          This example requires the local API. Run <code>bun run start</code> to
          test the File {">"} Export {">"} KiCad Library feature.
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
