import { RunFrameWithApi } from "lib/components/RunFrameWithApi/RunFrameWithApi"
import { useState, useEffect } from "react"
import { isFileApiAccessible } from "./utils/isFileApiAccessible.ts"

/**
 * Test fixture for validating file extension filtering in auto-selection
 *
 * This fixture tests the fix for the issue where runframe would switch to
 * .ts files instead of .tsx files when saving/updating code.
 */
export default () => {
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    // Create initial files
    setTimeout(async () => {
      try {
        // Create a .tsx file (should be visible in UI)
        await fetch("/api/files/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_path: "components/component.tsx",
            text_content: `export default () => (
  <board width="10mm" height="10mm">
    <resistor name="R1" resistance="1k" footprint="0402" />
  </board>
)`,
          }),
        })
        setLog((prev) => [...prev, "✓ Created components/component.tsx"])

        // Create a .ts file (should NOT be visible in UI due to filter)
        await fetch("/api/files/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_path: "components/utils.ts",
            text_content: `export const calculateValue = (value: number) => value * 2`,
          }),
        })
        setLog((prev) => [
          ...prev,
          "✓ Created components/utils.ts (NOT in file browser)",
        ])

        // Create another .tsx file as fallback
        await fetch("/api/files/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_path: "components/fallback.tsx",
            text_content: `export default () => (
  <board width="5mm" height="5mm">
    <capacitor name="C1" capacitance="10uF" footprint="0603" />
  </board>
)`,
          }),
        })
        setLog((prev) => [...prev, "✓ Created components/fallback.tsx"])

        // Signal that initial files have been uploaded
        await fetch("/api/events/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "INITIAL_FILES_UPLOADED",
            file_count: 3,
          }),
        })
        setLog((prev) => [...prev, "✓ Signaled INITIAL_FILES_UPLOADED event"])
      } catch (error) {
        setLog((prev) => [...prev, `✗ Error creating files: ${error}`])
      }
    }, 500)
  }, [])

  const deleteComponentFile = async () => {
    try {
      await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "FILE_DELETED",
          file_path: "components/component.tsx",
        }),
      })
      setLog((prev) => [
        ...prev,
        "✓ Deleted components/component.tsx",
        "→ File browser should auto-select components/fallback.tsx (NOT utils.ts)",
      ])
    } catch (error) {
      setLog((prev) => [...prev, `✗ Error deleting file: ${error}`])
    }
  }

  if (!isFileApiAccessible()) {
    return <div>API not accessible</div>
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left panel with test controls */}
      <div
        style={{
          width: "300px",
          padding: "20px",
          background: "#f5f5f5",
          overflowY: "auto",
          borderRight: "1px solid #ddd",
        }}
      >
        <h2 style={{ marginTop: 0 }}>File Extension Filtering Test</h2>

        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "14px", marginBottom: "10px" }}>
            Test Files Created:
          </h3>
          <ul
            style={{
              fontSize: "12px",
              lineHeight: "1.6",
              margin: 0,
              paddingLeft: "20px",
            }}
          >
            <li>
              <strong>components/component.tsx</strong> - Visible in file
              browser ✓
            </li>
            <li>
              <strong>components/utils.ts</strong> - Hidden from file browser ✗
            </li>
            <li>
              <strong>components/fallback.tsx</strong> - Visible in file browser
              ✓
            </li>
          </ul>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "14px", marginBottom: "10px" }}>
            Test Actions:
          </h3>
          <button
            onClick={deleteComponentFile}
            style={{
              padding: "10px 15px",
              background: "#ff6b6b",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            Delete component.tsx
          </button>
          <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
            Click to delete component.tsx and trigger auto-selection. The file
            browser should pick fallback.tsx, NOT utils.ts
          </p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "14px", marginBottom: "10px" }}>
            Expected Behavior:
          </h3>
          <ol
            style={{
              fontSize: "12px",
              lineHeight: "1.8",
              margin: 0,
              paddingLeft: "20px",
              color: "#666",
            }}
          >
            <li>Delete component.tsx</li>
            <li>File browser should auto-select fallback.tsx</li>
            <li>utils.ts should NEVER be auto-selected</li>
            <li>File dropdown should show only .tsx files</li>
          </ol>
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#e8f5e9",
            borderRadius: "4px",
          }}
        >
          <h3 style={{ fontSize: "14px", marginTop: 0 }}>Log:</h3>
          <div
            style={{
              fontSize: "11px",
              lineHeight: "1.6",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {log.length === 0 ? (
              <span style={{ color: "#999" }}>
                Waiting for files to load...
              </span>
            ) : (
              log.map((entry, idx) => <div key={idx}>{entry}</div>)
            )}
          </div>
        </div>
      </div>

      {/* Right panel with RunFrame */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <RunFrameWithApi
          debug
          showFilesSwitch
          showToggleFullScreen
          defaultToFullScreen={false}
        />
      </div>
    </div>
  )
}
