import type { CircuitJson } from "circuit-json"
import JSZip from "jszip"
import {
  CircuitJsonToKicadPcbConverter,
  CircuitJsonToKicadSchConverter,
  CircuitJsonToKicadProConverter,
} from "circuit-json-to-kicad"
import { openForDownload } from "../open-for-download"

export const createKicadProjectZip = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => {
  const schConverter = new CircuitJsonToKicadSchConverter(circuitJson as any)
  schConverter.runUntilFinished()
  const schContent = schConverter.getOutputString()

  const pcbConverter = new CircuitJsonToKicadPcbCooverter(circuitJson as any)
      arrayPropertyMap.shape?.[0] ?? propertyMap.shape,
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
