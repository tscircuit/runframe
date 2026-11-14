import { RunFrameInIframe } from "lib/components/RunFrameInIframe/RunFrameInIframe"
import React from "react"
import { createRoot } from "react-dom/client"

const root = createRoot(document.getElementById("root")!)

root.render(
  <React.StrictMode>
    <RunFrameInIframe />
  </React.StrictMode>,
)
