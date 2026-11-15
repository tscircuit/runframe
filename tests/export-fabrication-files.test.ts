import { setDynamicImportResolver } from "@tscircuit/internal-dynamic-import"
import { expect, mock, test } from "bun:test"
import JSZip from "jszip"
import {
  availableExports,
  exportAndDownload,
} from "../lib/optional-features/exporting/export-and-download"

test("Fabrication Files export places Gerber, drill, BOM, and PnP files at the ZIP root matching CLI export", async () => {
  expect(availableExports).toContainEqual({
    extension: "zip",
    name: "Fabrication Files",
  })

  const originalDocument = globalThis.document
  const originalCreateObjectURL = URL.createObjectURL
  let downloadedBlob: Blob | undefined
  const anchor = {
    download: "",
    href: "",
    style: { display: "" },
    click: mock(() => {}),
  } as unknown as HTMLAnchorElement

  setDynamicImportResolver((specifier) => import(specifier))
  try {
    globalThis.document = {
      body: { appendChild: () => anchor, removeChild: () => anchor },
      createElement: () => anchor,
    } as unknown as Document
    URL.createObjectURL = (blob) => {
      downloadedBlob = blob as Blob
      return "blob:fabrication-test"
    }

    await exportAndDownload({
      exportName: "Fabrication Files",
      projectName: "example/board",
      circuitJson: [
        {
          type: "pcb_board",
          pcb_board_id: "pcb_board_1",
          center: { x: 0, y: 0 },
          width: 10,
          height: 10,
          num_layers: 2,
          material: "fr4",
          thickness: 1.4,
        },
        {
          type: "source_component",
          source_component_id: "sc_1",
          ftype: "simple_resistor",
          name: "R1",
          resistance: 1000,
        },
        {
          type: "pcb_component",
          pcb_component_id: "pc_1",
          source_component_id: "sc_1",
          center: { x: 0, y: 0 },
          layer: "top",
          rotation: 0,
          width: 1.6,
          height: 0.8,
        },
        {
          type: "pcb_plated_hole",
          pcb_plated_hole_id: "ph_1",
          shape: "circle",
          x: 1,
          y: 1,
          outer_diameter: 1.6,
          hole_diameter: 0.8,
          layers: ["top", "bottom"],
        },
      ],
    })

    expect(anchor.download).toBe("example_board_fabrication_files.zip")
    expect(anchor.click).toHaveBeenCalledTimes(1)
    expect(downloadedBlob).toBeDefined()

    const zip = await JSZip.loadAsync(await downloadedBlob!.arrayBuffer())
    const entryNames = Object.keys(zip.files).sort()

    // Every entry must live at the ZIP root (no nested gerber/ folder or inner .zip)
    expect(entryNames.some((name) => name.includes("/"))).toBe(false)
    expect(entryNames.some((name) => name.endsWith(".zip"))).toBe(false)
    expect(entryNames).toContain("bom.csv")
    expect(entryNames).toContain("pick_and_place.csv")
    expect(entryNames.some((name) => name.endsWith(".drl"))).toBe(true)
    expect(
      entryNames.some(
        (name) =>
          name.endsWith(".gbr") ||
          name.endsWith(".gtl") ||
          name.endsWith(".gbl") ||
          name.endsWith(".gko"),
      ),
    ).toBe(true)

    const bomContents = await zip.file("bom.csv")!.async("string")
    expect(bomContents).toContain("R1")
  } finally {
    setDynamicImportResolver(undefined)
    globalThis.document = originalDocument
    URL.createObjectURL = originalCreateObjectURL
  }
})
