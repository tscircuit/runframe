import { createRoot } from "react-dom/client"
import { RunFrameWithApi } from "./RunFrameWithApi"
import { RunFrameForCli } from "../RunFrameForCli/RunFrameForCli"
import { RunFrame } from "../RunFrame/RunFrame"
import { RunFrameStaticBuildViewer } from "../RunFrameStaticBuildViewer/RunFrameStaticBuildViewer"
import type { CircuitJsonFileReference } from "../RunFrameStaticBuildViewer/RunFrameStaticBuildViewer"
import type { ComponentProps } from "react"

declare global {
  interface Window {
    TSCIRCUIT_USE_RUNFRAME_FOR_CLI?: boolean
    TSCIRCUIT_RUNFRAME_STATIC_FILE_LIST?: CircuitJsonFileReference[]
  }
}

const ensureDocumentReady = (): Promise<void> => {
  return new Promise((resolve) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => resolve())
    } else {
      resolve()
    }
  })
}

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

// This variable is dynamically modified inside build scripts in the "tscircuit"
// repo to inject the latest CDN URL for the webworker blob
const INJECT_TSCIRCUIT_EVAL_WEB_WORKER_BLOB_URL =
  "<--INJECT_TSCIRCUIT_EVAL_WEB_WORKER_BLOB_URL-->"
const INJECT_ENABLE_FETCH_PROXY = "<--INJECT_ENABLE_FETCH_PROXY-->"
const runframeStandaloneProps: ComponentProps<typeof RunFrameWithApi> = {
  evalWebWorkerBlobUrl: INJECT_TSCIRCUIT_EVAL_WEB_WORKER_BLOB_URL.includes(
    "<--",
  )
    ? undefined
    : INJECT_TSCIRCUIT_EVAL_WEB_WORKER_BLOB_URL,
  enableFetchProxy: INJECT_ENABLE_FETCH_PROXY.includes("<--")
    ? undefined
    : true,
}
;(async () => {
  await ensureDocumentReady()

  const root = createRoot(ensureRoot())

  const staticFileList = window.TSCIRCUIT_RUNFRAME_STATIC_FILE_LIST
  if (Array.isArray(staticFileList)) {
    root.render(<RunFrameStaticBuildViewer files={staticFileList} />)
  } else if (window.TSCIRCUIT_USE_RUNFRAME_FOR_CLI) {
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
