import { createRoot } from "react-dom/client"
import { RunFrameWithApi } from "./RunFrameWithApi"
import { RunFrameForCli } from "../RunFrameForCli/RunFrameForCli"
import { RunFrame } from "../RunFrame/RunFrame"
import type { ComponentProps } from "react"

const ensureRoot = () => {
  const existing = document.getElementById("root")
  if (existing) return existing
  const el = document.createElement("div")
  el.id = "root"
  el.style.height = "100vh"
  document.body.appendChild(el)
  return el
}

const loadScriptsAsFsMap = async () => {
  const scripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>(
      "script[type='tscircuit-tsx']",
    ),
  )
  const fsMap = new Map<string, string>()
  await Promise.all(
    scripts.map(async (script, idx) => {
      const path =
        script.dataset.path ||
        script.getAttribute("data-file-path") ||
        `script${idx ? idx + 1 : ""}.tsx`

      if (script.src) {
        const response = await fetch(script.src)
        const text = await response.text()
        fsMap.set(path, text)
      } else {
        fsMap.set(path, script.textContent || "")
      }
    }),
  )
  return { fsMap }
}

const root = createRoot(ensureRoot())

// This variable is dynamically modified inside build scripts in the "tscircuit"
// repo to inject the latest CDN URL for the webworker blob
const INJECT_TSCIRCUIT_WORKER_BLOB_URL = undefined
const runframeStandaloneProps: ComponentProps<typeof RunFrameWithApi> = {
  workerBlobUrl: INJECT_TSCIRCUIT_WORKER_BLOB_URL,
}
;(async () => {
  // @ts-ignore
  if (window.TSCIRCUIT_USE_RUNFRAME_FOR_CLI) {
    root.render(<RunFrameForCli {...runframeStandaloneProps} />)
  } else {
    const { fsMap } = await loadScriptsAsFsMap()
    if (fsMap.size > 0) {
      root.render(<RunFrame {...runframeStandaloneProps} fsMap={fsMap} />)
    } else {
      root.render(<RunFrameWithApi {...runframeStandaloneProps} />)
    }
  }
})()
