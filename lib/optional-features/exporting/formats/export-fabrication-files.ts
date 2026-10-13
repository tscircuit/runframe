import importer from "@tscircuit/internal-dynamic-import"
import type { AnyCircuitElement } from "circuit-json"
import JSZip from "jszip"
import { toast } from "lib/utils/toast"
import { openForDownload } from "../open-for-download"

type CircuitJsonToGerber = typeof import("circuit-json-to-gerber")

type PnpCsvConverter = (
  circuitJson: AnyCircuitElement[],
  options?: {
    flip_y_axis?: boolean
    supplier?: string
  },
) => string

export const exportFabricationFiles = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: AnyCircuitElement[]
  projectName: string
}) => {
  await toast.promise(
    (async () => {
      const zip = new JSZip()

      const [
        gerberConverter,
        { convertCircuitJsonToBomRows, convertBomRowsToCsv },
        { convertCircuitJsonToPickAndPlaceCsv },
      ] = await Promise.all([
        importer("circuit-json-to-gerber") as Promise<CircuitJsonToGerber>,
        importer("circuit-json-to-bom-csv"),
        importer("circuit-json-to-pnp-csv"),
      ])

      // Filter out error and warning elements for gerber/drill generation
      const filteredCircuitJson = circuitJson.filter(
        (element) => !("error_type" in element) && !("warning_type" in element),
      ) as any

      const gerberFiles = gerberConverter.convertCircuitJsonToGerberFiles(
        filteredCircuitJson,
        {
          flip_y_axis: false,
        },
      )
      for (const [fileName, fileContents] of Object.entries(gerberFiles)) {
        zip.file(`gerber/${fileName}`, fileContents)
      }

      // Generate BOM CSV
      const bomRows = await convertCircuitJsonToBomRows({ circuitJson })
      const bomCsv = await convertBomRowsToCsv(bomRows)
      zip.file("bom.csv", bomCsv)

      // Generate Pick and Place CSV
      const pnpCsv = await (
        convertCircuitJsonToPickAndPlaceCsv as PnpCsvConverter
      )(circuitJson, {
        supplier: "jlcpcb",
      })
      zip.file("pick_and_place.csv", pnpCsv)

      // Generate and download the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" })

      openForDownload(zipBlob, {
        fileName: `${projectName}_fabrication_files.zip`,
      })
    })(),
    {
      loading: "Generating fabrication files...",
      success: "Fabrication ZIP ready",
      error: (error) =>
        `Failed to generate fabrication files: ${
          error instanceof Error ? error.message : String(error)
        }`,
    },
  )
}
