import { RunFrame } from "lib/runner"
import React, { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

const root = createRoot(document.getElementById("root")!)

function IframeApp() {
  const [vfs, setVfs] = useState<Record<string, string>>({})
  const [entrypoint, setEntrypoint] = useState<string>("main.tsx")

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data) {
        if (event.data.vfs && typeof event.data.vfs === "object") {
          setVfs(event.data.vfs)
        }
        if (
          event.data.entrypoint &&
          typeof event.data.entrypoint === "string"
        ) {
          setEntrypoint(event.data.entrypoint)
        }
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <RunFrame
        fsMap={vfs}
        entrypoint={entrypoint}
        showRunButton={true}
        debug={window.location.search.includes("debug")}
      />
    </div>
  )
}

root.render(
  <React.StrictMode>
    <IframeApp />
  </React.StrictMode>,
)
