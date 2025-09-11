import type { CircuitJson } from "circuit-json"
import { exportFabricationFiles } from "./formats/export-fabrication-files"
import { exportGlb } from "./formats/export-glb"
import { openForDownload } from "./open-for-download"

export const availableExports = [
  { extension: "json", name: "Circuit JSON" },
  { extension: "zip", name: "Fabrication Files" },
  // { extension: "svg", name: "SVG" },
  // { extension: "dsn", name: "Specctra DSN" },
  { extension: "glb", name: "GLB (Binary GLTF)" },
  // { extension: "kicad_mod", name: "KiCad Module" },
  // { extension: "kicad_project", name: "KiCad Project" },
  // { extension: "gbr", name: "Gerbers" },
] as const satisfies Array<{ extension: string; name: string }>

type ExportName = (typeof availableExports)[number]["name"]

export const exportAndDownload = async ({
  exportName,
  circuitJson,
  projectName,
}: {
  exportName: ExportName
  circuitJson: CircuitJson
  projectName: string
}) => {
  if (exportName === "Fabrication Files") {
    exportFabricationFiles({ circuitJson, projectName })
    return
  }
  if (exportName === "Circuit JSON") {
    openForDownload(JSON.stringify(circuitJson, null, 2), {
      fileName: `${projectName}.circuit.json`,
      mimeType: "application/json",
    })
    return
  }
  if (exportName === "GLB (Binary GLTF)") {
    await exportGlb({ circuitJson, projectName })
    return
  }
  throw new Error(`Unsupported export type: "${exportName}"`)
}
