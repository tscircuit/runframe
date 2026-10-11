import type { CircuitJson } from "circuit-json"
import { toast } from "lib/utils/toast"
import { getPrintedPartsJscad } from "../get-printed-parts-jscad"
import { openForDownload } from "../open-for-download"

export const exportCombinedStep = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => {
  try {
    const geometry = getPrintedPartsJscad(circuitJson)
    const { jscadToStep } = await import("jscad-to-step")
    const stepText = jscadToStep(geometry)
    openForDownload(new Blob([stepText], { type: "application/step" }), {
      fileName: `${projectName}-combined.step`,
    })
  } catch (error) {
    toast.error(
      `Failed to export combined STEP: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
