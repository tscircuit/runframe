import type { AnyCircuitElement } from "circuit-json"
import JSZip from "jszip"
import { toast } from "lib/utils/toast"
import {
  loadGerberConverter,
  loadBomCsvConverter,
  loadPnpCsvConverter,
} from "../dynamic-converters"
import { openForDownload } from "../open-for-download"

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

      const [gerberMod, bomMod, pnpMod] = await Promise.all([
        loadGerberConverter(),
        loadBomCsvConverter(),
        loadPnpCsvConverter(),
      ])
      const {
        stringifyGerberCommandLayers,
        convertSoupToGerberCommands,
        convertSoupToExcellonDrillCommands,
        stringifyExcellonDrill,
      } = gerberMod

      // Filter out error and warning elements for gerber/drill generation
      const filteredCircuitJson = circuitJson.filter(
        (element) => !("error_type" in element) && !("warning_type" in element),
      ) as any

      // Generate Gerber files
      const gerberLayerCmds = convertSoupToGerberCommands(filteredCircuitJson, {
        flip_y_axis: false,
      })
      const gerberFileContents = stringifyGerberCommandLayers(gerberLayerCmds)

      for (const [fileName, fileContents] of Object.entries(
        gerberFileContents,
      )) {
        zip.file(`gerber/${fileName}.gbr`, fileContents)
      }

      // Generate Drill files
      const drillCmds = convertSoupToExcellonDrillCommands({
        circuitJson: filteredCircuitJson,
        is_plated: true,
        flip_y_axis: false,
      })
      const drillFileContents = stringifyExcellonDrill(drillCmds)
      zip.file("gerber/drill.drl", drillFileContents)

      // Generate BOM CSV
      const bomRows = await bomMod.convertCircuitJsonToBomRows({ circuitJson })
      const bomCsv = await bomMod.convertBomRowsToCsv(bomRows)
      zip.file("bom.csv", bomCsv)

      // Generate Pick and Place CSV
      const pnpCsv =
        await pnpMod.convertCircuitJsonToPickAndPlaceCsv(circuitJson)
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
