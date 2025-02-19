import { createRoot } from "react-dom/client"
import { RunFrameWithApi } from "./RunFrameWithApi"
import { RunFrameForCli } from "../RunFrameForCli/RunFrameForCli"

const root = createRoot(document.getElementById("root")!)

// @ts-ignore
if (window.TSCIRCUIT_USE_RUNFRAME_FOR_CLI) {
  root.render(<RunFrameForCli />)
} else {
  root.render(<RunFrameWithApi />)
}
