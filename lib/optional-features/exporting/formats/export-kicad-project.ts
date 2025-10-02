import type { CircuitJson } from "circuit-json"
import JSZip from "jszip"
import {
  CircuitJsonToKicadPcbConverter,
  CircuitJsonToKicadSchConverter,
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

  const pcbConverter = new CircuitJsonToKicadPcbConverter(circuitJson as any)
  pcbConverter.runUntilFinished()
  const pcbContent = pcbConverter.getOutputString()

  const zip = new JSZip()

  zip.file(`${projectName}.kicad_sch`, schContent)
  zip.file(`${projectName}.kicad_pcb`, pcbContent)

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
