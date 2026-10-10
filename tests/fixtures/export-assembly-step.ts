import { afterEach, expect, mock, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { jscadToStep } from "jscad-to-step"

const convertToStep = jscadToStep
const convert = mock(convertToStep)
const showError = mock(() => {})
mock.module("jscad-to-step", () => ({ jscadToStep: convert }))
mock.module("lib/utils/toast", () => ({ toast: { error: showError } }))

const { availableExports, exportAndDownload } = await import(
  "../../lib/optional-features/exporting/export-and-download"
)

const originalDocument = globalThis.document
const originalCreateObjectURL = URL.createObjectURL
let downloadedBlob: Blob | undefined
const anchor = {
  download: "",
  href: "",
  style: { display: "" },
  click: mock(() => {}),
}

afterEach(() => {
  globalThis.document = originalDocument
  URL.createObjectURL = originalCreateObjectURL
  downloadedBlob = undefined
  anchor.download = ""
  anchor.click.mockClear()
  convert.mockClear()
  showError.mockClear()
})

const setUpDownload = () => {
  globalThis.document = {
    body: { appendChild: () => anchor, removeChild: () => anchor },
    createElement: () => anchor,
  } as unknown as Document
  URL.createObjectURL = (blob) => {
    downloadedBlob = blob
    return "blob:assembly-test"
  }
}

const printablePart = (id: string, x: number): CircuitJson => [
  {
    type: "source_component",
    source_component_id: id,
    ftype: "printedpart",
    name: id,
  },
  {
    type: "cad_component",
    cad_component_id: `${id}_cad`,
    source_component_id: id,
    model_jscad: { type: "cuboid", size: [4, 6, 2] },
    position: { x, y: 0, z: 0 },
    model_object_fit: "contain_within_bounds",
    anchor_alignment: "center",
  },
]

test("Assembly STEP downloads printable geometry without requiring a PCB", async () => {
  setUpDownload()
  expect(availableExports).toContainEqual({
    extension: "step",
    name: "Assembly STEP",
  })
  await exportAndDownload({
    exportName: "Assembly STEP",
    circuitJson: printablePart("SPACER", 0),
    projectName: "device/spacer",
  })

  expect(convert).toHaveBeenCalledTimes(1)
  expect(showError).not.toHaveBeenCalled()
  expect(anchor.download).toBe("device_spacer-assembly.step")
  expect(anchor.click).toHaveBeenCalledTimes(1)
  expect(downloadedBlob?.type).toBe("application/step")
  const step = await downloadedBlob!.text()
  expect(step).toStartWith("ISO-10303-21;")
  expect(step).toContain("MANIFOLD_SOLID_BREP")
  expect(step).toContain("SI_UNIT(.MILLI.,.METRE.)")
})

test("Assembly STEP includes multiple printable parts", async () => {
  setUpDownload()
  await exportAndDownload({
    exportName: "Assembly STEP",
    circuitJson: [...printablePart("LEFT", -10), ...printablePart("RIGHT", 10)],
    projectName: "two-parts",
  })

  expect(showError).not.toHaveBeenCalled()
  expect(anchor.click).toHaveBeenCalledTimes(1)
  const step = await downloadedBlob!.text()
  expect(step).toContain("(-12.")
  expect(step).toContain("(12.")
})

test("Assembly STEP reports missing geometry before converting", async () => {
  setUpDownload()
  await exportAndDownload({
    exportName: "Assembly STEP",
    circuitJson: [
      {
        type: "source_component",
        source_component_id: "missing",
        ftype: "printedpart",
        name: "MISSING",
      },
    ],
    projectName: "missing",
  })

  expect(convert).not.toHaveBeenCalled()
  expect(anchor.click).not.toHaveBeenCalled()
  expect(showError).toHaveBeenCalledWith(
    'Failed to export assembly STEP: Printed part "MISSING" needs JSCAD geometry for STEP export',
  )
})

test("Assembly STEP reports assemblies without printed parts", async () => {
  setUpDownload()
  await exportAndDownload({
    exportName: "Assembly STEP",
    circuitJson: [],
    projectName: "empty",
  })
  expect(convert).not.toHaveBeenCalled()
  expect(anchor.click).not.toHaveBeenCalled()
  expect(showError).toHaveBeenCalledWith(
    "Failed to export assembly STEP: No assembly.printedpart elements found to export",
  )
})
