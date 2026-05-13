import type { CircuitJson } from "circuit-json"
import JSZip from "jszip"
import importer from "@tscircuit/internal-dynamic-import"
import { openForDownload } from "../open-for-download"

const isBuiltinModelPath = (modelPath: string) =>
  modelPath.startsWith("http://modelcdn.tscircuit.com") ||
  modelPath.startsWith("https://modelcdn.tscircuit.com")

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

  for (const modelPath of pcbConverter.getModel3dSourcePaths()) {
    const response = await fetch(modelPath)
    if (!response.ok) {
      throw new Error(`Failed to fetch 3D model from ${modelPath}`)
    }

    let shapesDir = `${projectName}.3dshapes`
    if (isBuiltinModelPath(modelPath)) {
      shapesDir = "tscircuit_builtin.3dshapes"
    }

    const fileName = modelPath.split("/").pop() || modelPath

    zip.file(`3dmodels/${shapesDir}/${fileName}`, await response.arrayBuffer())
  }

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
