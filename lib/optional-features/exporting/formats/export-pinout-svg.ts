import type { PlatformConfig } from "@tscircuit/props"
import type { CircuitJson } from "circuit-json"
import { getPlatformImporter } from "lib/utils/get-platform-importer"
import { openForDownload } from "../open-for-download"

export const exportPinoutSvg = async ({
  circuitJson,
  projectName,
  platformConfig,
}: {
  circuitJson: CircuitJson
  projectName: string
  platformConfig?: PlatformConfig
}) => {
  const { convertCircuitJsonToPinoutSvg } =
    await getPlatformImporter(platformConfig)("circuit-to-svg")
  const svgString = convertCircuitJsonToPinoutSvg(circuitJson)

  openForDownload(svgString, {
    fileName: `${projectName}-pinout.svg`,
    mimeType: "image/svg+xml",
  })
}
