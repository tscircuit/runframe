import { createRoot } from "react-dom/client"
import { RunFrameWithApi } from "./RunFrameWithApi"
import { RunFrameForCli } from "../RunFrameForCli/RunFrameForCli"
import { RunFrame } from "../RunFrame/RunFrame"

const ensureRoot = () => {
  const existing = document.getElementById("root")
  if (existing) return existing
  const el = document.createElement("div")
  el.id = "root"
  el.style.height = "100vh"
  document.body.appendChild(el)
  return el
}

const loadScriptsAsFsMap = () => {
  const scripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>(
      "script[type='tscircuit-tsx']",
    ),
  )
  const fsMap = new Map<string, string>()
  scripts.forEach((script, idx) => {
    const path =
      script.dataset.path ||
      script.getAttribute("data-file-path") ||
      `script${idx ? idx + 1 : ""}.tsx`
    fsMap.set(path, script.textContent || "")
  })
  return { fsMap }
}

const root = createRoot(ensureRoot())

// @ts-ignore
if (window.TSCIRCUIT_USE_RUNFRAME_FOR_CLI) {
  root.render(<RunFrameForCli />)
} else {
  const { fsMap } = loadScriptsAsFsMap()
  if (fsMap.size > 0) {
    root.render(<RunFrame fsMap={fsMap} />)
  } else {
    root.render(<RunFrameWithApi />)
  }
}
