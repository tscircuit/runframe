import { RunFrameWithApi } from "lib/components/RunFrameWithApi/RunFrameWithApi"
import { useEffect, useState } from "react"

const longFile =
  "boards/power/VeryLongUnbrokenResponsivePowerSupplyBoardFilenameForTestingSmallScreenNavigation.tsx"

const boardSource = `
export default () => (
  <board width="20mm" height="15mm">
    <resistor name="R1" resistance="1k" footprint="0402" />
    <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={4} />
    <trace from=".R1 .pin1" to=".C1 .pin1" />
  </board>
)
`

// The Vite file-server plugin keeps these files in the local preview server.
// Use a separate preview server when working on another project concurrently.
export default () => {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    const initialize = async () => {
      const paths = [
        longFile,
        "boards/power/ShortBoard.tsx",
        "boards/VeryLongUnbrokenFolderNameForTestingSmallScreenSelectorNavigation/NestedBoard.tsx",
      ]
      for (const file_path of paths) {
        const response = await fetch("/api/files/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_path, text_content: boardSource }),
        })
        if (!response.ok) throw new Error(`Could not create ${file_path}`)
      }
      const response = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "INITIAL_FILES_UPLOADED",
          file_count: paths.length,
        }),
      })
      if (!response.ok) throw new Error("Could not initialize files")
      if (!cancelled) setReady(true)
    }
    initialize().catch((cause) => {
      if (!cancelled) setError(String(cause))
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) return <div>{error}</div>
  if (!ready) return <div>Preparing responsive fixture…</div>

  return (
    <RunFrameWithApi
      showFilesSwitch
      showFileMenu
      initialMainComponentPath={longFile}
    />
  )
}
