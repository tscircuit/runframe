import { RunFrameForCli } from "lib/components/RunFrameForCli/RunFrameForCli"
import React, { useEffect } from "react"

export default () => {
  useEffect(() => {
    // Seed initial file (main.tsx) first, then delay util.ts upload to simulate late file availability
    const seed = async () => {
      try {
        await fetch("/api/events/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
        // Upsert main.tsx which imports util.ts (not uploaded yet)
        await fetch("/api/files/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_path: "main.tsx",
            text_content: `
import { partName } from "./util.ts"

export default () => (
  <board width="10mm" height="10mm">
    <resistor name={partName} resistance="1k" footprint="0402" />
  </board>
)
`.trim(),
          }),
        })

        // Upload util.ts after a delay to reproduce "delayed file uploads"
        setTimeout(async () => {
          await fetch("/api/files/upsert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file_path: "util.ts",
              text_content: `export const partName = "R1"`,
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
        }, 2000)
      } catch (e) {
        console.error("Failed to seed example32 files", e)
      }
    }
    seed()
  }, [])

  return <RunFrameForCli debug />
}
