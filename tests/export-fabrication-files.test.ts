import { expect, mock, test } from "bun:test"
import { setDynamicImportResolver } from "@tscircuit/internal-dynamic-import"
import type { CircuitJson } from "circuit-json"
import * as circuitJsonToBomCsv from "circuit-json-to-bom-csv"
import * as circuitJsonToGerber from "circuit-json-to-gerber"
import * as circuitJsonToPnpCsv from "circuit-json-to-pnp-csv"
import JSZip from "jszip"
import {
  availableExports,
  exportAndDownload,
} from "../lib/optional-features/exporting/export-and-download"

test("Fabrication Files export places Gerber and drill files at ZIP root alongside BOM and PnP", async () => {
  expect(availableExports).toContainEqual({
    extension: "zip",
    name: "Fabrication Files",
  })

  const circuitJson = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_1",
      center: { x: 0, y: 0 },
      width: 20,
      height: 15,
      thickness: 1.6,
      num_layers: 2,
      material: "fr4",
    },
    {
      type: "source_component",
      source_component_id: "source_component_1",
      ftype: "simple_resistor",
      name: "R1",
      resistance: 1000,
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_1",
      source_component_id: "source_component_1",
      center: { x: 0, y: 0 },
      width: 1.8,
      height: 1.0,
      layer: "top",
      rotation: 0,
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_1",
      pcb_component_id: "pcb_component_1",
      shape: "rect",
      x: -0.5,
      y: 0,
      width: 0.6,
      height: 0.9,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_2",
      pcb_component_id: "pcb_component_1",
      shape: "rect",
      x: 0.5,
      y: 0,
      width: 0.6,
      height: 0.9,
      layer: "top",
    },
    {
      type: "pcb_via",
      pcb_via_id: "pcb_via_1",
      x: 3,
      y: 0,
      outer_diameter: 0.6,
      hole_diameter: 0.3,
      layers: ["top", "bottom"],
    },
    {
      type: "pcb_trace_error",
      pcb_trace_error_id: "pcb_trace_error_1",
      error_type: "pcb_trace_error",
      message: "Ignored during Gerber generation",
      center: { x: 0, y: 0 },
      pcb_trace_id: "pcb_trace_1",
      source_trace_id: "source_trace_1",
      pcb_component_ids: [],
      pcb_port_ids: [],
    },
  ] as CircuitJson

  const originalDocument = globalThis.document
  const originalCreateObjectURL = URL.createObjectURL
  const previousResolver = (
    globalThis as { tscircuitDynamicImportResolver?: any }
  ).tscircuitDynamicImportResolver
  let downloadedBlob: Blob | undefined
  const anchor = {
    download: "",
    href: "",
    style: { display: "" },
    click: mock(() => {}),
  } as unknown as HTMLAnchorElement

  const localConverters: Record<string, unknown> = {
    "circuit-json-to-gerber": circuitJsonToGerber,
    "circuit-json-to-bom-csv": circuitJsonToBomCsv,
    "circuit-json-to-pnp-csv": circuitJsonToPnpCsv,
  }

  try {
    setDynamicImportResolver(async (specifier, fallback) =>
      Object.hasOwn(localConverters, specifier)
        ? localConverters[specifier]
        : fallback(specifier),
    )

    globalThis.document = {
      body: { appendChild: () => anchor, removeChild: () => anchor },
      createElement: () => anchor,
    } as unknown as Document
    URL.createObjectURL = (blob) => {
      downloadedBlob = blob as Blob
      return "blob:fabrication-files-test"
    }

    await exportAndDownload({
      exportName: "Fabrication Files",
      projectName: "example/board",
      circuitJson,
    })

    expect(anchor.download).toBe("example_board_fabrication_files.zip")
    expect(anchor.click).toHaveBeenCalledTimes(1)
    expect(downloadedBlob?.type).toBe("application/zip")

    const zip = await JSZip.loadAsync(await downloadedBlob!.arrayBuffer())
    const entryNames = Object.keys(zip.files).sort()

    expect(entryNames).toContain("bom.csv")
    expect(entryNames).toContain("pick_and_place.csv")
    expect(entryNames.some((name) => name.endsWith(".gbr"))).toBe(true)
    expect(entryNames.some((name) => name.endsWith(".drl"))).toBe(true)
    expect(
      entryNames.every((name) => !name.includes("/") && !zip.files[name]!.dir),
    ).toBe(true)

    const bomCsv = await zip.file("bom.csv")!.async("string")
    expect(bomCsv).toContain("R1")

    const pnpCsv = await zip.file("pick_and_place.csv")!.async("string")
    expect(pnpCsv).toContain("R1")
  } finally {
    setDynamicImportResolver(previousResolver)
    globalThis.document = originalDocument
    URL.createObjectURL = originalCreateObjectURL
  }
})
