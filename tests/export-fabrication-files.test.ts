import { expect, mock, test } from "bun:test"
import JSZip from "jszip"
import {
  availableExports,
  exportAndDownload,
} from "../lib/optional-features/exporting/export-and-download"

test("Fabrication Files exports Gerbers beside the CSVs, matching the CLI ZIP layout", async () => {
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
    const files = Object.values(zip.files)
      .filter((entry) => !entry.dir)
      .map((entry) => entry.name)
    expect(files).toContain("bom.csv")
    expect(files).toContain("pick_and_place.csv")
    const gerberFiles = files.filter(
      (name) => name !== "bom.csv" && name !== "pick_and_place.csv",
    )
    expect(gerberFiles.length).toBeGreaterThan(0)
    expect(
      gerberFiles.every(
        (name) => !name.includes("/") && !name.toLowerCase().endsWith(".zip"),
      ),
    ).toBe(true)
  } finally {
    globalThis.document = originalDocument
    URL.createObjectURL = originalCreateObjectURL
  }
})
