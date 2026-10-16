import { expect, mock, spyOn, test } from "bun:test"
import * as dynamicImporter from "@tscircuit/internal-dynamic-import"
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
  const originalImporter = dynamicImporter.default
  const fixtureGerberFiles = {
    "top-copper.gbr": "G04 synthetic copper fixture*\nM02*\n",
    "drill.drl": "M48\n%\nM30\n",
  }
  const bomCsv = "Designator,Quantity\nR1,1\n"
  const pnpCsv = "Designator,X,Y\nR1,0,0\n"
  // Exercise real ZIP packaging without loading browser-only CDN converters.
  const importerSpy = spyOn(dynamicImporter, "default").mockImplementation(
    async (moduleName) => {
      if (moduleName === "circuit-json-to-gerber") {
        return {
          convertCircuitJsonToGerberFiles: () => fixtureGerberFiles,
        }
      }
      if (moduleName === "circuit-json-to-bom-csv") {
        return {
          convertCircuitJsonToBomRows: async () => [],
          convertBomRowsToCsv: async () => bomCsv,
        }
      }
      if (moduleName === "circuit-json-to-pnp-csv") {
        return { convertCircuitJsonToPickAndPlaceCsv: async () => pnpCsv }
      }
      return originalImporter(moduleName)
    },
  )
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
    for (const [name, contents] of Object.entries({
      ...fixtureGerberFiles,
      "bom.csv": bomCsv,
      "pick_and_place.csv": pnpCsv,
    })) {
      expect(await zip.file(name)!.async("string")).toBe(contents)
    }
  } finally {
    importerSpy.mockRestore()
    globalThis.document = originalDocument
    URL.createObjectURL = originalCreateObjectURL
  }
})
