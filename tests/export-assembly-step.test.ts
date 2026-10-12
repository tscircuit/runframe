import { expect, mock, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import JSZip from "jszip"
import {
  availableExports,
  exportAndDownload,
} from "../lib/optional-features/exporting/export-and-download"

test("Assembly STEP downloads a ZIP containing separate printed parts", async () => {
  expect(availableExports).toContainEqual({
    extension: "zip",
    name: "Assembly STEP",
  })
  const circuitJson = [
    {
      type: "pcb_board",
      pcb_board_id: "board",
      center: { x: 0, y: 0 },
      width: 20,
      height: 10,
      thickness: 1.6,
    },
    ...["BASE", "PLATE"].flatMap((name, i) => [
      {
        type: "source_component",
        source_component_id: name,
        ftype: "printedpart",
        name,
      },
      {
        type: "cad_component",
        cad_component_id: `cad_${name}`,
        source_component_id: name,
        position: { x: 0, y: 0, z: i * 2 },
        model_jscad: { type: "cuboid", size: [10, 10, 2] },
      },
    ]),
  ] as CircuitJson
  const before = structuredClone(circuitJson)
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
      return "blob:assembly-step-test"
    }
    await exportAndDownload({
      exportName: "Assembly STEP",
      projectName: "corne/left",
      circuitJson,
    })
    expect(anchor.download).toBe("corne_left-assembly.zip")
    expect(anchor.click).toHaveBeenCalledTimes(1)
    const zip = await JSZip.loadAsync(await downloadedBlob!.arrayBuffer())
    expect(Object.keys(zip.files)).toEqual(["BASE.step", "PLATE.step"])
    for (const name of ["BASE", "PLATE"]) {
      const step = await zip.file(`${name}.step`)!.async("string")
      expect(step).toContain("ISO-10303-21;")
      expect(step.match(/MANIFOLD_SOLID_BREP/g)).toHaveLength(1)
      expect(step).toContain(`'${name}'`)
      expect(step).not.toContain(name === "BASE" ? "'PLATE'" : "'BASE'")
    }
    expect(circuitJson).toEqual(before)
    await exportAndDownload({
      exportName: "Assembly STEP",
      projectName: "empty",
      circuitJson: [],
    })
    expect(anchor.click).toHaveBeenCalledTimes(1)
  } finally {
    globalThis.document = originalDocument
    URL.createObjectURL = originalCreateObjectURL
  }
})
