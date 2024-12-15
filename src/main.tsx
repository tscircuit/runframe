import { RunFrameWithApi } from "lib/components/RunFrameWithApi"
import React from "react"
import { createRoot } from "react-dom/client"

const root = createRoot(document.getElementById("root")!)

root.render(
  <React.StrictMode>
    <div style={{ width: "100vw", height: "100vh" }}>
      <RunFrameWithApi />
    </div>
  </React.StrictMode>,
)
