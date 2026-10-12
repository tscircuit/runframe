import type { CircuitJson } from "circuit-json"
import JSZip from "jszip"
import { toast } from "lib/utils/toast"
import { getStepConverter } from "../get-step-converter"
import { openForDownload } from "../open-for-download"

export const exportPrintedPartSteps = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => {
  await toast.promise(
    (async () => {
      const { circuitJsonToPrintedPartStepFiles } = await getStepConverter()
      const files = circuitJsonToPrintedPartStepFiles(circuitJson)
      const zip = new JSZip()
      for (const [fileName, content] of Object.entries(files)) {
        zip.file(fileName, content)
      }
      openForDownload(await zip.generateAsync({ type: "blob" }), {
        fileName: `${projectName}-printed-parts-step.zip`,
      })
    })(),
    {
      loading: "Generating separate printed-part STEP files...",
      success: "Printed parts STEP ZIP ready",
      error: (error) =>
        `Failed to export printed parts: ${error instanceof Error ? error.message : String(error)}`,
    },
  )
}
