import type { CircuitJson } from "circuit-json"
import { sanitizeFileName } from "lib/utils/sanitizeFileName"
import { exportFabricationFiles } from "./formats/export-fabrication-files"
import { exportGlb } from "./formats/export-glb"
import { exportKicadLibrary } from "./formats/export-kicad-library"
import { exportKicadProject } from "./formats/export-kicad-project"
import { exportLbrn } from "./formats/export-lbrn"
import { exportPinoutSvg } from "./formats/export-pinout-svg"
import { exportStep } from "./formats/export-step"
import { openForDownload } from "./open-for-download"

export const availableExports = [
  { extension: "json", name: "Circuit JSON" },
  { extension: "json", name: "Simple Route JSON" },
  { extension: "zip", name: "Fabrication Files" },
  { extension: "zip", name: "KiCad Project" },
  { extension: "zip", name: "KiCad Library" },
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
  simpleRouteJson,
  projectName: rawProjectName,
}: {
  exportName: ExportName
  circuitJson: CircuitJson
  simpleRouteJson?: any
  projectName: string
}) => {
  const projectName = sanitizeFileName(rawProjectName)

  if (exportName === "Fabrication Files") {
    await exportFabricationFiles({ circuitJson, projectName })
    return
  }
  if (exportName === "KiCad Project") {
    await exportKicadProject({ circuitJson, projectName })
    return
  }
  if (exportName === "KiCad Library") {
    await exportKicadLibrary({ circuitJson, projectName })
    return
  }
  if (exportName === "Circuit JSON") {
    openForDownload(JSON.stringify(circuitJson, null, 2), {
      fileName: `${projectName}.circuit.json`,
      mimeType: "application/json",
    })
    return
  }
  if (exportName === "Simple Route JSON") {
    if (!simpleRouteJson) {
      throw new Error("No Simple Route JSON available to export")
    }
    openForDownload(JSON.stringify(simpleRouteJson, null, 2), {
      fileName: `${projectName}.simple-route.json`,
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
