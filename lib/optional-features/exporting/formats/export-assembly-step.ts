import type { CircuitJson } from "circuit-json"
import { toast } from "lib/utils/toast"
import { getStepConverter } from "../get-step-converter"
import { openForDownload } from "../open-for-download"

export const exportAssemblyStep = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => {
  try {
    const { circuitJsonToStep } = await getStepConverter()
    const stepText = await circuitJsonToStep(circuitJson, {
      exportMode: "assembly",
    })
    openForDownload(new Blob([stepText], { type: "application/step" }), {
      fileName: `${projectName}-assembly.step`,
    })
  } catch (error) {
    toast.error(
      `Failed to export assembly STEP: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
