import { describe, expect, spyOn, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import JSZip from "jszip"
import * as bom from "circuit-json-to-bom-csv"
import type { CircuitJson } from "circuit-json"
import {
  createBundledModuleProvider,
  OfflineModuleUnavailableError,
} from "../lib/runtime/bundled-module-provider"
import {
  RunFrameRuntimeProvider,
  useRunFrameRuntime,
} from "../lib/runtime/context"
import { createOfflineRuntime } from "../lib/runtime/offline"
import { createLocalFetch } from "../lib/runtime/local-fetch"
import { getOfflineWorkerOptions } from "../lib/runtime/offline-worker-options"
import { exportAndDownload } from "../lib/optional-features/exporting/export-and-download"
import { searchKicadFootprints } from "../lib/components/ImportComponentDialog2/api/kicad"

const circuitJson: CircuitJson = [
  {
    type: "pcb_board",
    pcb_board_id: "board1",
    center: { x: 0, y: 0 },
    width: 10,
    height: 10,
    num_layers: 2,
    material: "fr4",
    thickness: 1.6,
  },
  {
    type: "source_component",
    source_component_id: "source1",
    name: "R1",
    ftype: "simple_resistor",
    resistance: 1000,
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb1",
    source_component_id: "source1",
    pcb_board_id: "board1",
    center: { x: 0, y: 0 },
    width: 2,
    height: 1.2,
    rotation: 0,
    layer: "top",
  },
]

describe("offline runtime", () => {
  test("module registries are snapshots and missing modules never use a CDN", async () => {
    const registry = { "circuit-json-to-bom-csv": bom }
    const provider = createBundledModuleProvider(registry)
    const fetchSpy = spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("No Internet"),
    )
    try {
      delete (registry as Partial<typeof registry>)["circuit-json-to-bom-csv"]
      expect(await provider.load("circuit-json-to-bom-csv")).toBe(bom)
      await expect(
        provider.load("circuit-json-to-gerber"),
      ).rejects.toBeInstanceOf(OfflineModuleUnavailableError)
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      fetchSpy.mockRestore()
    }
  })

  test("nested runtime contexts do not replace a sibling's provider", () => {
    const outer = createOfflineRuntime({ evalVersion: "1.0.0" })
    const inner = createOfflineRuntime({ evalVersion: "2.0.0" })
    const Version = () => <span>{useRunFrameRuntime().evalVersion}</span>
    expect(
      renderToStaticMarkup(
        <RunFrameRuntimeProvider runtime={outer}>
          <Version />
          <RunFrameRuntimeProvider runtime={inner}>
            <Version />
          </RunFrameRuntimeProvider>
          <Version />
        </RunFrameRuntimeProvider>,
      ),
    ).toBe("<span>1.0.0</span><span>2.0.0</span><span>1.0.0</span>")
  })

  test("fabrication export uses real bundled converters with fetch denied", async () => {
    const fetchSpy = spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("No Internet"),
    )
    const originalDocument = globalThis.document
    const originalCreateObjectURL = URL.createObjectURL
    let downloadedBlob: Blob | undefined
    const anchor = { download: "", href: "", style: {}, click() {} }
    try {
      const runtime = createOfflineRuntime()
      globalThis.document = {
        body: { appendChild() {}, removeChild() {} },
        createElement: () => anchor,
      } as unknown as Document
      URL.createObjectURL = (blob) => {
        downloadedBlob = blob as Blob
        return "blob:offline-test"
      }
      await exportAndDownload({
        exportName: "Fabrication Files",
        circuitJson,
        projectName: "offline/board",
        runtime,
      })
      expect(anchor.download).toBe("offline_board_fabrication_files.zip")
      const zip = await JSZip.loadAsync(await downloadedBlob!.arrayBuffer())
      expect(
        Object.keys(zip.files).some(
          (path) => path.startsWith("gerber/") && !path.endsWith("/"),
        ),
      ).toBe(true)
      expect(await zip.file("bom.csv")!.async("string")).toContain("R1")
      expect(await zip.file("pick_and_place.csv")!.async("string")).toContain(
        "R1",
      )
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      fetchSpy.mockRestore()
      globalThis.document = originalDocument
      URL.createObjectURL = originalCreateObjectURL
    }
  })
})

describe("local resource transport", () => {
  test("KiCad indexes are scoped to their resource provider and failed loads can retry", async () => {
    const base = createOfflineRuntime()
    let attempts = 0
    const first = {
      ...base,
      fetch: async () => {
        attempts++
        if (attempts === 1) throw new Error("missing local index")
        return Response.json(["Resistor_SMD.pretty/R_0805.kicad_mod"])
      },
    }
    const second = {
      ...base,
      fetch: async () =>
        Response.json(["Capacitor_SMD.pretty/C_0805.kicad_mod"]),
    }
    await expect(searchKicadFootprints("0805", 20, first)).rejects.toThrow(
      "missing local index",
    )
    expect(await searchKicadFootprints("0805", 20, first)).toEqual([
      "Resistor_SMD.pretty/R_0805.kicad_mod",
    ])
    expect(await searchKicadFootprints("0805", 20, second)).toEqual([
      "Capacitor_SMD.pretty/C_0805.kicad_mod",
    ])
    expect(await searchKicadFootprints("0805", 20, first)).toEqual([
      "Resistor_SMD.pretty/R_0805.kicad_mod",
    ])
    expect(attempts).toBe(2)
  })

  test("blocks public resources before fetching and rejects redirect following", async () => {
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(new Uint8Array([0, 128, 255])),
    )
    try {
      const localFetch = createLocalFetch("http://127.0.0.1:3020/")
      await expect(
        localFetch("https://jscdn.tscircuit.com/example/+esm"),
      ).rejects.toThrow("not available locally")
      expect(fetchSpy).not.toHaveBeenCalled()
      const response = await localFetch("/model.glb")
      expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([
        0, 128, 255,
      ])
      expect(fetchSpy.mock.calls[0]?.[1]?.redirect).toBe("error")
      expect(String(fetchSpy.mock.calls[0]?.[0])).toBe(
        "http://127.0.0.1:3020/model.glb",
      )
    } finally {
      fetchSpy.mockRestore()
    }
  })
})

describe("offline worker startup", () => {
  test("requires a local worker and exact version instead of CDN fallback", () => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, "location")
    Object.defineProperty(globalThis, "location", {
      configurable: true,
      value: new URL("http://127.0.0.1:3020/"),
    })
    try {
      const runtime = createOfflineRuntime({
        workerUrl: "/worker.js",
        evalVersion: "0.0.1581",
      })
      expect(getOfflineWorkerOptions(runtime, {})).toEqual({
        evalVersion: "0.0.1581",
        webWorkerBlobUrl: "http://127.0.0.1:3020/worker.js",
        disableCdnLoading: true,
      })
      expect(() => getOfflineWorkerOptions(createOfflineRuntime(), {})).toThrow(
        "No evaluator will be downloaded",
      )
      expect(() =>
        getOfflineWorkerOptions(runtime, { evalVersion: "latest" }),
      ).toThrow("not included")
      expect(() =>
        getOfflineWorkerOptions(
          createOfflineRuntime({
            workerUrl: "https://unpkg.com/worker.js",
            evalVersion: "0.0.1581",
          }),
          {},
        ),
      ).toThrow("local application origin")
    } finally {
      if (previous) Object.defineProperty(globalThis, "location", previous)
      else Reflect.deleteProperty(globalThis, "location")
    }
  })
})
