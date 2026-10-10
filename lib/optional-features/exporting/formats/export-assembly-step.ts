import type { CircuitJson } from "circuit-json"
import { toast } from "lib/utils/toast"
import { getAssemblyJscad } from "../get-assembly-jscad"
import { openForDownload } from "../open-for-download"

export const exportAssemblyStep = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => {
  try {
    const geometry = getAssemblyJscad(circuitJson)
    const { jscadToStep } = await import("jscad-to-step")
    const stepText = jscadToStep(geometry)
    openForDownload(new Blob([stepText], { type: "application/step" }), {
      fileName: `${projectName}-assembly.step`,
    })
  } catch (error) {
    toast.error(
      `Failed to export assembly STEP: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
