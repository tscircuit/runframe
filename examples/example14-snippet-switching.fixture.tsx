import { RunFrameWithApi } from "lib/components/RunFrameWithApi/RunFrameWithApi"
import { useState, useEffect } from "react"
import { Button } from "lib/components/ui/button"

export default () => {
  const [currentSnippet, setCurrentSnippet] = useState<
    "resistor" | "capacitor"
  >("resistor")

  useEffect(() => {
    // Setup initial files
    const setupFiles = async () => {
      // Reset any existing files
      await fetch("/api/events/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      // Create initial files
      await fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "main.tsx",
          text_content:
            currentSnippet === "resistor"
              ? `circuit.add(
  <board width="10mm" height="10mm">
    <resistor name="R1" resistance="1k" footprint="0402" />
  </board>
)`
              : `circuit.add(
  <board width="10mm" height="10mm">
    <capacitor name="C1" capacitance="1uF" footprint="0603" />
  </board>
)`,
        }),
      })

      await fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "manual-edits.json",
          text_content: "{}",
        }),
      })
    }

    setupFiles()
  }, [currentSnippet])

  if (
    typeof window !== "undefined" &&
    window.location.origin.includes("vercel.app")
  ) {
    return (
      <div>
        <h1>RunFrame Snippet Switching Test</h1>
        <p>
          We don't currently deploy the API to vercel, try locally! The vite
          plugin will automatically load it.
        </p>
      </div>
    )
  }

  return (
    <div className="rf-flex rf-flex-col rf-gap-4">
      <div className="rf-flex rf-gap-4 rf-p-4">
        <Button
          onClick={() => setCurrentSnippet("resistor")}
          variant={currentSnippet === "resistor" ? "default" : "outline"}
        >
          Show Resistor
        </Button>
        <Button
          onClick={() => setCurrentSnippet("capacitor")}
          variant={currentSnippet === "capacitor" ? "default" : "outline"}
        >
          Show Capacitor
        </Button>
      </div>
      <RunFrameWithApi debug />
    </div>
  )
}
