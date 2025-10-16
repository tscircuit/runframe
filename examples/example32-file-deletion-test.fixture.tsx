import { RunFrameWithApi } from "lib/components/RunFrameWithApi/RunFrameWithApi"
import { useState, useEffect } from "react"
import { isFileApiAccessible } from "./utils/isFileApiAccessible.ts"

export default () => {
  const [deletedFile, setDeletedFile] = useState<string | null>(null)

  useEffect(() => {
    // Create test files
    setTimeout(async () => {
      await fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "test1.tsx",
          text_content: `export default () => (
  <board width="10mm" height="10mm">
    <resistor name="R1" resistance="1k" footprint="0402" />
  </board>
)`,
        }),
      })

      await fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "test2.tsx",
          text_content: `export default () => (
  <board width="20mm" height="20mm">
    <capacitor name="C1" capacitance="10uF" footprint="0603" />
  </board>
)`,
        }),
      })
    }, 500)
  }, [])

  const deleteFile = async (filePath: string) => {
    await fetch("/api/events/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "FILE_DELETED",
        file_path: filePath,
      }),
    })
    setDeletedFile(filePath)
  }

  if (!isFileApiAccessible()) {
    return <div>API not accessible</div>
  }

  return (
    <div>
      <div style={{ padding: "10px", background: "#f0f0f0" }}>
        <button
          onClick={() => deleteFile("test1.tsx")}
          style={{ marginRight: "10px" }}
        >
          Delete test1.tsx
        </button>
        <button
          onClick={() => deleteFile("test2.tsx")}
          style={{ marginRight: "10px" }}
        >
          Delete test2.tsx
        </button>
        {deletedFile && (
          <span style={{ marginLeft: "10px", color: "red" }}>
            ✓ Deleted: {deletedFile}
          </span>
        )}
      </div>
      <RunFrameWithApi debug showFilesSwitch />
    </div>
  )
}
