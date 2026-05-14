import type { CircuitJson } from "circuit-json"
import JSZip from "jszip"
import importer from "@tscircuit/internal-dynamic-import"
import { openForDownload } from "../open-for-download"

export const createKicadProjectZip = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => {
  const {
    CircuitJsonToKicadPcbConverter,
    CircuitJsonToKicadSchConverter,
    CircuitJsonToKicadProConverter,
    resolveAndLoadKicad3dModelFiles,
  } = await importer("circuit-json-to-kicad")
  const schConverter = new CircuitJsonToKicadSchConverter(circuitJson as any)
  schConverter.runUntilFinished()
  const schContent = schConverter.getOutputString()

  const pcbConverter = new CircuitJsonToKicadPcbConverter(circuitJson as any, {
    includeBuiltin3dModels: true,
    projectName,
  })
  pcbConverter.runUntilFinished()
  const pcbContent = pcbConverter.getOutputString()

  const proConverter = new CircuitJsonToKicadProConverter(circuitJson as any, {
    projectName,
    schematicFilename: `${projectName}.kicad_sch`,
    pcbFilename: `${projectName}.kicad_pcb`,
  })
  proConverter.runUntilFinished()
  const proContent = proConverter.getOutputString()

  const zip = new JSZip()

  zip.file(`${projectName}.kicad_sch`, schContent)
  zip.file(`${projectName}.kicad_pcb`, pcbContent)
  zip.file(`${projectName}.kicad_pro`, proContent)

  await resolveAndLoadKicad3dModelFiles({
    projectName,
    model3dSourcePaths: pcbConverter.getModel3dSourcePaths(),
    fetch,
    onModelFile: ({ outputPath, content }) => {
      zip.file(outputPath, content)
    },
    onError: ({ sourcePath }) => {
      console.warn(`Failed to load 3D model from ${sourcePath}`)
    },
  })

  return zip
}

export const exportKicadProject = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => {
  const zip = await createKicadProjectZip({ circuitJson, projectName })
  const zipBlob = await zip.generateAsync({ type: "blob" })

  openForDownload(zipBlob, {
    fileName: `${projectName}_kicad_project.zip`,
  })
}
