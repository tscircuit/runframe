import { createRoot } from "react-dom/client"
import { RunFrameWithApi } from "./RunFrameWithApi"
import { RunFrameForCli } from "../RunFrameForCli/RunFrameForCli"
import { useRunFrameStore } from "./store"
import { getFsMapFromScripts } from "lib/utils"

async function init() {
  const fsMap = await getFsMapFromScripts()
  if (fsMap.size > 0) {
    useRunFrameStore.setState({
      fsMap,
      loadInitialFiles: async () => {},
    })
  }

  const root = createRoot(document.getElementById("root")!)
  // @ts-ignore
  if (window.TSCIRCUIT_USE_RUNFRAME_FOR_CLI) {
    root.render(<RunFrameForCli />)
  } else {
    root.render(<RunFrameWithApi />)
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
