import { expect, mock, test } from "bun:test"
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

test("KiCad project ZIP includes hierarchical child schematic files", async () => {
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
  ).toEqual(["logic.kicad_sch", "power.kicad_sch", rootSchematicFilename])
  expect(missingSchematicFilenames).toEqual([])
}, 30_000)
