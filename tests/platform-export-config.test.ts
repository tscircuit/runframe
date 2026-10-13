import { expect, mock, test } from "bun:test"
import type { PlatformConfig } from "@tscircuit/props"
import { exportAndDownload } from "../lib/optional-features/exporting/export-and-download"
import { createKicadProjectZip } from "../lib/optional-features/exporting/formats/export-kicad-project"
import { loadKicadFootprintCircuitJson } from "../lib/components/ImportComponentDialog2/api/kicad"

test("exportAndDownload forwards a caller's module transport", async () => {
  const platformFetch = mock(
    async () =>
      new Response(`
    export const convertCircuitJsonToPinoutSvg = () => '<svg>enterprise</svg>'
  `),
  )
  const platformConfig: PlatformConfig = {
    jscdnBaseUrl: "/jscdn",
    platformFetch: platformFetch as unknown as typeof fetch,
  }
  const previousDocument = globalThis.document
  const anchor = {
    download: "",
    href: "",
    style: { display: "" },
    click: mock(() => {}),
  }
  globalThis.document = {
    body: { appendChild: () => anchor, removeChild: () => anchor },
    createElement: () => anchor,
  } as unknown as Document
  try {
    await exportAndDownload({
      exportName: "Pinout SVG",
      circuitJson: [],
      projectName: "enterprise",
      platformConfig,
    })
    expect(platformFetch).toHaveBeenCalledWith(
      "/jscdn/circuit-to-svg/latest/+esm",
    )
    expect(anchor.download).toBe("enterprise-pinout.svg")
    expect(anchor.click).toHaveBeenCalledTimes(1)
  } finally {
    globalThis.document = previousDocument
  }
})

test("KiCad project conversion and model loading both use the caller's platform", async () => {
  const platformFetch = mock(async (url: string) => {
    if (url === "/models/enterprise.step")
      return new Response("enterprise STEP")
    return new Response(`
      class Converter {
        runUntilFinished() {}
        getOutputString() { return 'kicad' }
        getModel3dSourcePaths() { return ['/models/enterprise.step'] }
      }
      export { Converter as CircuitJsonToKicadPcbConverter,
        Converter as CircuitJsonToKicadSchConverter,
        Converter as CircuitJsonToKicadProConverter }
      export const resolveAndLoadKicad3dModelFiles = async ({ fetch, onModelFile }) => {
        const response = await fetch('/models/enterprise.step')
        onModelFile({ outputPath: 'models/enterprise.step', content: await response.text() })
      }
    `)
  })
  const zip = await createKicadProjectZip({
    circuitJson: [],
    projectName: "enterprise",
    platformConfig: {
      jscdnBaseUrl: "/jscdn",
      platformFetch: platformFetch as unknown as typeof fetch,
    },
  })
  expect(platformFetch.mock.calls.map(([url]) => url)).toEqual([
    "/jscdn/circuit-json-to-kicad/latest/+esm",
    "/models/enterprise.step",
  ])
  expect(await zip.file("models/enterprise.step")!.async("string")).toBe(
    "enterprise STEP",
  )
})

test("KiCad footprint previews pass platform transport to resources and converter", async () => {
  const platformFetch = mock(async (url: string) => {
    if (url.includes("kicad-mod-cache"))
      return new Response("enterprise footprint")
    return new Response(`
      export class KicadFootprintToCircuitJsonConverter {
        addFile(name, content) { this.content = content }
        runUntilFinished() {}
        getOutput() { return [{ type: 'pcb_note_text', text: this.content }] }
      }
    `)
  })
  const output = await loadKicadFootprintCircuitJson(
    "Test.pretty/Enterprise.kicad_mod",
    {
      jscdnBaseUrl: "/jscdn",
      platformFetch: platformFetch as unknown as typeof fetch,
    },
  )
  expect(output).toEqual([
    { type: "pcb_note_text", text: "enterprise footprint" },
  ])
  expect(platformFetch.mock.calls.map(([url]) => url)).toEqual([
    "https://kicad-mod-cache.tscircuit.com/Test.pretty/Enterprise.kicad_mod",
    "/jscdn/kicad-to-circuit-json/latest/+esm",
  ])
})
