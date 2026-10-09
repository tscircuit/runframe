import { getDefaultRuntime } from "lib/runtime/default-runtime"
import type { RunFrameRuntime } from "lib/runtime/types"
import type { CircuitJson } from "circuit-json"
import { openForDownload } from "../open-for-download"

export const exportPinoutSvg = async ({
  circuitJson,
  projectName,
  runtime = getDefaultRuntime(),
}: {
  circuitJson: CircuitJson
  projectName: string
  runtime?: RunFrameRuntime
}) => {
  const { convertCircuitJsonToPinoutSvg } =
    await runtime.modules.load("circuit-to-svg")
  const svgString = convertCircuitJsonToPinoutSvg(circuitJson)

  openForDownload(svgString, {
    fileName: `${projectName}-pinout.svg`,
    mimeType: "image/svg+xml",
  })
}
