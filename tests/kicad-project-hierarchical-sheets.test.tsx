import { expect, mock, test } from "bun:test"
import "bun-match-svg"
import type { CircuitJson } from "circuit-json"
import * as circuitJsonToKicad from "circuit-json-to-kicad"

mock.module("@tscircuit/internal-dynamic-import", () => ({
  default: async (moduleName: string) => {
    if (moduleName !== "circuit-json-to-kicad") {
      throw new Error(`Unexpected dynamic import: ${moduleName}`)
    }

    return circuitJsonToKicad
  },
}))

const { createKicadProjectZip } = await import(
  "../lib/optional-features/exporting/formats/export-kicad-project"
)

const hierarchicalCircuitJson: CircuitJson = [
  {
    type: "pcb_board",
    pcb_board_id: "pcb_board_0",
    center: { x: 0, y: 0 },
    width: 20,
    height: 20,
    thickness: 1.4,
    num_layers: 2,
    material: "fr4",
  },
  {
    type: "schematic_sheet",
    schematic_sheet_id: "schematic_sheet_power",
    name: "Power",
    sheet_index: 0,
    sheet_size: "a4",
  },
  {
    type: "schematic_sheet",
    schematic_sheet_id: "schematic_sheet_logic",
    name: "Logic",
    sheet_index: 1,
    sheet_size: "a4",
  },
]

const getReferencedSchematicFilenames = (rootSchematic: string) =>
  Array.from(
    rootSchematic.matchAll(/\(property "Sheetfile" "([^"]+)"/g),
    (match) => match[1]!,
  ).sort()

const escapeXmlText = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")

const renderMissingChildSheetsSvg = ({
  archivedFilenames,
  rootSchematicFilename,
  missingSchematicFilenames,
}: {
  archivedFilenames: string[]
  rootSchematicFilename: string
  missingSchematicFilenames: string[]
}) => {
  const archivedRows = archivedFilenames
    .map(
      (filename, index) =>
        `<text x="90" y="${190 + index * 42}" font-size="22" fill="#172033">${escapeXmlText(filename)}</text>`,
    )
    .join("")
  const missingRows = missingSchematicFilenames
    .map(
      (filename, index) =>
        `<g transform="translate(570 ${160 + index * 100})">
          <rect width="260" height="68" rx="8" fill="#fff1f1" stroke="#d7263d" stroke-width="3" stroke-dasharray="10 8" />
          <text x="130" y="30" text-anchor="middle" font-size="21" fill="#9f1427">${escapeXmlText(filename)}</text>
          <text x="130" y="54" text-anchor="middle" font-size="16" font-weight="700" fill="#d7263d">MISSING FROM ZIP</text>
        </g>`,
    )
    .join("")

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500" viewBox="0 0 900 500">
    <rect width="900" height="500" fill="#ffffff" />
    <text x="450" y="52" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#172033">BUG: CHILD KICAD SHEETS ARE MISSING FROM ZIP</text>
    <g font-family="Arial, sans-serif">
      <text x="230" y="110" text-anchor="middle" font-size="22" font-weight="700" fill="#172033">FILES INSIDE THE ZIP</text>
      <rect x="55" y="135" width="350" height="240" rx="12" fill="#edf7ee" stroke="#25823b" stroke-width="3" />
      ${archivedRows}
      <text x="700" y="110" text-anchor="middle" font-size="22" font-weight="700" fill="#172033">FILES REFERENCED BY ROOT</text>
      ${missingRows}
      <path d="M 405 240 C 475 240 490 210 550 210" fill="none" stroke="#667085" stroke-width="3" marker-end="url(#arrow)" />
      <text x="450" y="420" text-anchor="middle" font-size="20" fill="#344054">${escapeXmlText(rootSchematicFilename)} references child sheets that are absent from the ZIP.</text>
    </g>
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#667085" />
      </marker>
    </defs>
  </svg>`
}

test("KiCad project ZIP omits hierarchical child schematic files", async () => {
  const projectName = "project"
  const rootSchematicFilename = `${projectName}.kicad_sch`
  const zip = await createKicadProjectZip({
    circuitJson: hierarchicalCircuitJson,
    projectName,
  })
  const archivedFilenames = Object.keys(zip.files).sort()
  const rootSchematic = await zip.file(rootSchematicFilename)!.async("string")
  const referencedSchematicFilenames =
    getReferencedSchematicFilenames(rootSchematic)
  const missingSchematicFilenames = referencedSchematicFilenames.filter(
    (filename) => !zip.file(filename),
  )

  expect(referencedSchematicFilenames).toEqual([
    "logic.kicad_sch",
    "power.kicad_sch",
  ])
  expect(
    archivedFilenames.filter((filename) => filename.endsWith(".kicad_sch")),
  ).toEqual([rootSchematicFilename])
  expect(missingSchematicFilenames).toEqual(referencedSchematicFilenames)

  await expect(
    renderMissingChildSheetsSvg({
      archivedFilenames,
      rootSchematicFilename,
      missingSchematicFilenames,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
}, 30_000)
