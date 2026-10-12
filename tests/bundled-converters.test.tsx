import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { setDynamicImportResolver } from "@tscircuit/internal-dynamic-import"
import { loadRunFrameModule } from "lib/optional-features/importing/load-bundled-runframe-module"

test("bundled fabrication and KiCad converters process a locally rendered board without fetching", async () => {
  const previousFetch = globalThis.fetch
  const requests: unknown[] = []
  globalThis.fetch = Object.assign(
    async (...request: Parameters<typeof fetch>) => {
      requests.push(request)
      throw new Error("External requests are disabled")
    },
    { preconnect: () => {} },
  )
  try {
    const circuit = new Circuit({
      platform: {
        partsEngineDisabled: true,
        checkAvailability: false,
        enablePartOrientationAnalysis: false,
        useCloudAutorouter: false,
      },
    })
    circuit.add(
      <board width="20mm" height="20mm" routingDisabled>
        <resistor name="R1" resistance="1k" footprint="0805" />
      </board>,
    )
    await circuit.renderUntilSettled()
    const circuitJson = circuit.getCircuitJson()
    const [bom, gerber, pnp, svg, kicad, kicadImport] = await Promise.all([
      loadRunFrameModule("circuit-json-to-bom-csv"),
      loadRunFrameModule("circuit-json-to-gerber"),
      loadRunFrameModule("circuit-json-to-pnp-csv"),
      loadRunFrameModule("circuit-to-svg"),
      loadRunFrameModule("circuit-json-to-kicad"),
      loadRunFrameModule("kicad-to-circuit-json"),
    ])
    const rows = await bom.convertCircuitJsonToBomRows({ circuitJson })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.designator).toBe("R1")
    expect(bom.convertBomRowsToCsv(rows)).toContain("R1")
    const gerbers = gerber.convertCircuitJsonToGerberFiles(circuitJson as any)
    expect(Object.values(gerbers).some((file) => file.includes("%FSLA"))).toBe(
      true,
    )
    expect(pnp.convertCircuitJsonToPickAndPlaceCsv(circuitJson)).toContain("R1")
    expect(svg.convertCircuitJsonToPinoutSvg(circuitJson)).toContain("<svg")
    const pcb = new kicad.CircuitJsonToKicadPcbConverter(circuitJson as any)
    pcb.runUntilFinished()
    expect(pcb.getOutputString()).toContain("kicad_pcb")
    const footprint = new kicadImport.KicadFootprintToCircuitJsonConverter()
    footprint.addFile(
      "Local.kicad_mod",
      '(footprint "Local" (version 20240108) (generator pcbnew) (layer "F.Cu") (pad "1" smd rect (at 0 0) (size 1 1) (layers "F.Cu" "F.Paste" "F.Mask")))',
    )
    footprint.runUntilFinished()
    expect(
      footprint.getOutput().filter((element) => element.type === "pcb_smtpad"),
    ).toHaveLength(1)
    expect(requests).toEqual([])
  } finally {
    globalThis.fetch = previousFetch
  }
})

test("a missing bundled converter rejects without delegating to the CDN resolver", async () => {
  const previousResolver = globalThis.tscircuitDynamicImportResolver
  const remoteRequests: string[] = []
  setDynamicImportResolver((specifier) => {
    remoteRequests.push(specifier)
    throw new Error("External module loading is disabled")
  })
  try {
    await expect(loadRunFrameModule("missing-converter")).rejects.toThrow(
      "No bundled module registered",
    )
    expect(remoteRequests).toEqual([])
  } finally {
    setDynamicImportResolver(previousResolver)
  }
})
