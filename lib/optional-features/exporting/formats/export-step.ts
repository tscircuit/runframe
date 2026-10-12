import type { CircuitJson } from "circuit-json"
import JSZip from "jszip"
import { toast } from "lib/utils/toast"
import { getStepConverter } from "../get-step-converter"
import { openForDownload } from "../open-for-download"

export const exportStep = async ({
  circuitJson,
  projectName,
  exportMode,
}: {
  circuitJson: CircuitJson
  projectName: string
  exportMode?: "pcb" | "assembly"
}) => {
  try {
    const { circuitJsonToStep } = await getStepConverter()
    const output = await circuitJsonToStep(circuitJson, {
      exportMode,
      productName: projectName,
      includeComponents: true,
      includeExternalMeshes: true,
    })
    if (typeof output === "string") {
      openForDownload(new Blob([output], { type: "application/step" }), {
        fileName: `${projectName}.step`,
      })
    } else {
      const zip = new JSZip()
      for (const [fileName, content] of Object.entries(output)) {
        zip.file(fileName, content)
      }
      openForDownload(await zip.generateAsync({ type: "blob" }), {
        fileName: `${projectName}${exportMode === "assembly" ? "-assembly" : ""}-step.zip`,
      })
    }
  } catch (error) {
    toast.error(
      `Failed to export STEP: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
