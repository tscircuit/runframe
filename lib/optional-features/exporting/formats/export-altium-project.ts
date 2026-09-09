import type { CircuitJson } from "circuit-json"
import { toast } from "lib/utils/toast"
import { openForDownload } from "../open-for-download"

export const createAltiumProjectZip = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => {
  // Bundle the pinned Git dependency lazily; it is not yet on the importer CDN.
  const { convertCircuitJsonToAltiumZip } = await import(
    "circuit-json-to-altium"
  )
  const bytes = await convertCircuitJsonToAltiumZip(circuitJson, projectName)
  return new Blob([new Uint8Array(bytes)], { type: "application/zip" })
}

export const exportAltiumProject = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => {
  await toast.promise(
    (async () => {
      const zipBlob = await createAltiumProjectZip({ circuitJson, projectName })
      openForDownload(zipBlob, {
        fileName: `${projectName}_altium_project.zip`,
      })
    })(),
    {
      loading: "Generating Altium project...",
      success: "Altium project ZIP ready",
      error: (error) =>
        `Failed to generate Altium project: ${
          error instanceof Error ? error.message : String(error)
        }`,
    },
  )
}
