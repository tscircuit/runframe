import type { CircuitJson } from "circuit-json"
import { exportFabricationFiles } from "./formats/export-fabrication-files"
import { openForDownload } from "./open-for-download"
import { exportGlb } from "./formats/export-glb"
import { exportPinoutSvg } from "./formats/export-pinout-svg"
import { exportKicadProject } from "./formats/export-kicad-project"
import { exportStep } from "./formats/export-step"
import { exportLbrn } from "./formats/export-lbrn"

export const availableExports = [
  { extension: "json", name: "Circuit JSON" },
  { extension: "zip", name: "Fabrication Files" },
  { extension: "zip", name: "KiCad Project" },
  { extension: "glb", name: "GLB (Binary GLTF)" },
  { extension: "svg", name: "Pinout SVG" },
  { extension: "step", name: "STEP" },
  { extension: "lbrn2", name: "LightBurn" },
  // { extension: "svg", name: "SVG" },
  // { extension: "dsn", name: "Specctra DSN" },
  // { extension: "kicad_mod", name: "KiCad Module" },
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
  if (exportName === "KiCad Project") {
    await exportKicadProject({ circuitJson, projectName })
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
  if (exportName === "Pinout SVG") {
    exportPinoutSvg({ circuitJson, projectName })
    return
  }
  if (exportName === "STEP") {
    await exportStep({ circuitJson, projectName })
    return
  }
  if (exportName === "LightBurn") {
    await exportLbrn({ circuitJson, projectName })
    return
  }
  throw new Error(`Unsupported export type: "${exportName}"`)
}
