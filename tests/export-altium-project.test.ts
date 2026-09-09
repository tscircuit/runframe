import { expect, mock, test } from "bun:test"
import JSZip from "jszip"
import {
  availableExports,
  exportAndDownload,
} from "../lib/optional-features/exporting/export-and-download"

test("Altium menu export downloads native documents with a sanitized project name", async () => {
  expect(availableExports).toContainEqual({
    extension: "zip",
    name: "Altium Project",
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
      return "blob:altium-test"
    }

    await exportAndDownload({
      exportName: "Altium Project",
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

    expect(anchor.download).toBe("example_board_altium_project.zip")
    expect(anchor.click).toHaveBeenCalledTimes(1)
    expect(downloadedBlob?.type).toBe("application/zip")
    const zip = await JSZip.loadAsync(await downloadedBlob!.arrayBuffer())
    expect(Object.keys(zip.files).sort()).toEqual([
      "README.txt",
      "example_board.PcbDoc",
      "example_board.PrjPcb",
      "example_board.SchDoc",
    ])
    for (const extension of ["PcbDoc", "SchDoc"]) {
      const bytes = await zip
        .file(`example_board.${extension}`)!
        .async("uint8array")
      expect(Array.from(bytes.slice(0, 8))).toEqual([
        0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1,
      ])
    }
    const project = await zip.file("example_board.PrjPcb")!.async("string")
    expect(project).toContain("example_board.PcbDoc")
    expect(project).toContain("example_board.SchDoc")
  } finally {
    globalThis.document = originalDocument
    URL.createObjectURL = originalCreateObjectURL
  }
})
