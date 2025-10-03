import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToPinoutSvg } from "circuit-to-svg"
import { openForDownload } from "../open-for-download"

export const exportPinoutSvg = ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => {
  const svgString = convertCircuitJsonToPinoutSvg(circuitJson)

  openForDownload(svgString, {
    fileName: `${projectName}-pinout.svg`,
    mimeType: "image/svg+xml",
  })
}
