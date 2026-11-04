import { expect, mock, test } from "bun:test"
import { registerDynamicModule } from "@tscircuit/internal-dynamic-import"
import * as bomConverter from "circuit-json-to-bom-csv"
import * as gerberConverter from "circuit-json-to-gerber"
import * as pnpConverter from "circuit-json-to-pnp-csv"
import JSZip from "jszip"
import {
  availableExports,
  exportAndDownload,
} from "../lib/optional-features/exporting/export-and-download"

registerDynamicModule("circuit-json-to-gerber", gerberConverter)
registerDynamicModule("circuit-json-to-bom-csv", bomConverter)
registerDynamicModule("circuit-json-to-pnp-csv", pnpConverter)

test("Fabrication files export places gerber, bom, and pnp files at zip root without a gerber/ directory", async () => {
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
      ],
    })

    expect(anchor.download).toBe("example_board_fabrication_files.zip")
    expect(anchor.click).toHaveBeenCalledTimes(1)
    expect(downloadedBlob?.type).toBe("application/zip")

    const zip = await JSZip.loadAsync(await downloadedBlob!.arrayBuffer())
    const fileNames = Object.keys(zip.files)

    // Ensure BOM and Pick and Place are present at root
    expect(fileNames).toContain("bom.csv")
    expect(fileNames).toContain("pick_and_place.csv")

    // Ensure no files are placed in a 'gerber/' subdirectory
    expect(fileNames.some((name) => name.startsWith("gerber/"))).toBe(false)

    // Ensure gerber files are placed directly at the root
    const hasGerberFilesAtRoot = fileNames.some(
      (name) =>
        !name.includes("/") &&
        (name.endsWith(".gbr") ||
          name.endsWith(".ger") ||
          name.endsWith(".gbl") ||
          name.endsWith(".gtl") ||
          name.endsWith(".gto") ||
          name.endsWith(".gbo")),
    )
    expect(hasGerberFilesAtRoot).toBe(true)
  } finally {
    globalThis.document = originalDocument
    URL.createObjectURL = originalCreateObjectURL
  }
})
