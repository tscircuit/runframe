import type { PlatformConfig } from "@tscircuit/props"
import type { CircuitJson } from "circuit-json"
import JSZip from "jszip"
import { toast } from "lib/utils/toast"
import { getStepConverter } from "../get-step-converter"
import { openForDownload } from "../open-for-download"

export const exportAssemblyStep = async ({
  circuitJson,
  projectName,
  platformConfig,
}: {
  circuitJson: CircuitJson
  projectName: string
  platformConfig?: PlatformConfig
}) => {
  try {
    const { circuitJsonToStep } = await getStepConverter(platformConfig)
    const files = await circuitJsonToStep(circuitJson, {
      exportMode: "assembly",
    })
    const zip = new JSZip()
    for (const [fileName, stepText] of Object.entries(files)) {
      zip.file(fileName, stepText)
    }
    openForDownload(await zip.generateAsync({ type: "blob" }), {
      fileName: `${projectName}-assembly.zip`,
    })
  } catch (error) {
    toast.error(
      `Failed to export assembly STEP: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
