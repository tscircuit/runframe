import type { CircuitJson } from "circuit-json"
import importer from "@tscircuit/internal-dynamic-import"
import { openForDownload } from "../open-for-download"

export const exportPinoutSvg = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => {
  const { convertCircuitJsonToPinoutSvg } = await importer("circuit-to-svg")
  const svgString = convertCircuitJsonToPinoutSvg(circuitJson)

  openForDownload(svgString, {
    fileName: `${projectName}-pinout.svg`,
    mimeType: "image/svg+xml",
  })
}
