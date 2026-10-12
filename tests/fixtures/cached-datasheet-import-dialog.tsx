import { expect, test } from "bun:test"
import type { PlatformConfig } from "@tscircuit/props"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createCachedDatasheetFetch } from "../../lib/optional-features/importing/datasheet-catalog/create-cached-datasheet-fetch"
import {
  fakeFileServer,
  registryImports,
  supplierImports,
  kicadImports,
  datasheetImports,
  registryImport,
  supplierImport,
  kicadImport,
  fakeSupplier,
  kicadRequests,
  previewJson,
} from "./fake-import-services"

const datasheetId = "b274f623-8acd-4b58-9448-96465d49f0e4"
const entry = {
  datasheet_id: datasheetId,
  chip_name: "CachedChip",
  description: "Cached SOIC component",
}
const datasheet = {
  datasheet_id: datasheetId,
  chip_name: entry.chip_name,
  ai_description: entry.description,
  footprinter_string: "soic8",
  pin_information: Array.from({ length: 8 }, (_, index) => ({
    pin_number: String(index + 1),
    name: [`SIGNAL${index + 1}`],
  })),
  pin_attributes: {
    SIGNAL1: { requiresPower: true, requiresVoltage: "3.3V" },
    SIGNAL8: { requiresGround: true },
  },
}

test("cached search, generated preview, and CLI save use only platformFetch", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "http://localhost",
    pretendToBeVisual: true,
  })
  const names = [
    "window",
    "document",
    "location",
    "Element",
    "HTMLElement",
    "HTMLInputElement",
    "HTMLButtonElement",
    "Node",
    "NodeFilter",
    "Event",
    "MouseEvent",
    "KeyboardEvent",
    "CustomEvent",
    "MutationObserver",
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "DocumentFragment",
    "navigator",
  ]
  const previous = Object.fromEntries(
    names.map((name) => [name, (globalThis as any)[name]]),
  )
  const previousFetch = globalThis.fetch
  for (const name of names) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value: (dom.window as any)[name],
    })
  }
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  const externalRequests: RequestInfo[] = []
  const fakeNetwork = async (input: RequestInfo) => {
    externalRequests.push(input)
    throw new Error("Unexpected global fetch")
  }
  globalThis.fetch = fakeNetwork as typeof fetch
  const fakeCacheFiles = new Map([
    [".cache/datasheets/index.json", JSON.stringify({ datasheets: [entry] })],
    [".cache/datasheets/parts/cachedchip.json", JSON.stringify({ datasheet })],
  ])
  const cacheReads: string[] = []
  let cacheMiss = false
  const platformFetch = createCachedDatasheetFetch({
    readCacheFile: (path) => {
      cacheReads.push(path)
      return cacheMiss ? null : (fakeCacheFiles.get(path) ?? null)
    },
  })
  const { createRoot } = await import("react-dom/client")
  const { ImportComponentDialogForCli } = await import(
    "../../lib/components/ImportComponentDialog2/ImportComponentDialogForCli"
  )
  const { ImportComponentDialog2 } = await import(
    "../../lib/components/ImportComponentDialog2/ImportComponentDialog2"
  )
  const platformConfig: PlatformConfig = { platformFetch }
  const root = createRoot(document.getElementById("root")!)
  let closeCount = 0
  const closed = () => {
    closeCount++
  }

  const search = async (query: string) => {
    const input = document.querySelector("input")!
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        dom.window.HTMLInputElement.prototype,
        "value",
      )!.set!
      setter.call(input, query)
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }))
    })
    const button = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Search",
    )!
    expect(button.disabled).toBe(false)
    await act(async () => button.click())
  }
  const importButton = () =>
    Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Import",
    )!
  const select = async (name: string) => {
    const row = Array.from(
      document.querySelectorAll(".rf-cursor-pointer"),
    ).find((row) => row.textContent?.includes(name))!
    expect(row).toBeDefined()
    await act(async () => (row as HTMLElement).click())
  }

  try {
    await act(async () =>
      root.render(
        <ImportComponentDialogForCli
          isOpen
          onClose={closed}
          cachedDatasheetImports
          platformConfig={platformConfig}
        />,
      ),
    )
    expect(document.body.textContent).toContain("Cached Datasheets")
    expect(document.querySelectorAll('[role="tab"]')).toHaveLength(0)
    await search("CachedChip")
    await select("CachedChip")
    expect(
      document.querySelector('[data-testid="local-preview"]'),
    ).not.toBeNull()
    expect(
      (previewJson.at(-1) as any[]).some(
        (element) => element.type === "pcb_smtpad",
      ),
    ).toBe(true)
    await act(async () => importButton().click())
    expect(fakeFileServer.writes).toHaveLength(1)
    expect([...fakeFileServer.files.keys()]).toEqual(["imports/CachedChip.tsx"])
    expect(fakeFileServer.files.get("imports/CachedChip.tsx")).toContain(
      "export const CachedChip",
    )
    expect(closeCount).toBe(1)
    const generatedTsx = fakeFileServer.files.get("imports/CachedChip.tsx")!
    expect(generatedTsx).toContain('footprint={"soic8"}')
    expect(generatedTsx).toContain('"requiresGround": true')
    expect(generatedTsx).toContain('"requiresVoltage": "3.3V"')
    expect(generatedTsx).toContain('"SIGNAL8"')
    expect(cacheReads).toContain(".cache/datasheets/index.json")
    expect(cacheReads).toContain(".cache/datasheets/parts/cachedchip.json")

    await search("CachedChip")
    cacheMiss = true
    await select("CachedChip")
    expect(document.body.textContent).toContain(
      "Datasheet cache file is missing",
    )
    await act(async () => importButton().click())
    expect(fakeFileServer.writes).toHaveLength(1)
    expect(closeCount).toBe(1)

    await search("Unknown")
    expect(document.body.textContent).toContain(
      "Datasheet cache file is missing",
    )
    expect(importButton().disabled).toBe(true)
    expect(fakeFileServer.writes).toHaveLength(1)

    await act(async () =>
      root.render(
        <ImportComponentDialogForCli
          isOpen
          onClose={closed}
          cachedDatasheetImports
        />,
      ),
    )
    await search("CachedChip")
    expect(document.body.textContent).toContain(
      "require platformConfig.platformFetch",
    )
    expect(importButton().disabled).toBe(true)

    // Begin with an online registry result, then switch the same mounted dialog.
    const onlineProps = {
      isOpen: true,
      onClose: closed,
      onTscircuitPackageSelected: registryImport,
      onJlcpcbComponentTsxLoaded: supplierImport,
      onKicadStringSelected: kicadImport,
      onDatasheetComponentTsxLoaded: async (value: unknown) => {
        datasheetImports.push(value)
      },
      platformConfig,
    }
    await act(async () =>
      root.render(<ImportComponentDialog2 {...onlineProps} />),
    )
    await search("RemoteComponent")
    await select("RemoteComponent")
    expect(importButton().disabled).toBe(false)
    cacheMiss = false
    await act(async () =>
      root.render(
        <ImportComponentDialog2 {...onlineProps} cachedDatasheetImports />,
      ),
    )
    expect(document.body.textContent).not.toContain("RemoteComponent")
    expect(document.body.textContent).not.toContain("JLCPCB Parts")
    expect(document.body.textContent).not.toContain("KiCad Footprints")
    expect(importButton().disabled).toBe(true)
    await act(async () => importButton().click())
    expect(registryImports).toHaveLength(0)
    expect(supplierImports).toHaveLength(0)
    expect(kicadImports).toHaveLength(0)
    expect(fakeSupplier.searches).toHaveLength(0)
    expect(fakeSupplier.loads).toHaveLength(0)
    expect(fakeSupplier.previews).toHaveLength(0)
    expect(kicadRequests).toHaveLength(0)
    expect(externalRequests).toHaveLength(0)

    // A load started in online mode must not complete an online import after
    // the host enables the cached catalog.
    fakeSupplier.components = [
      {
        lcscId: 123,
        manufacturer: "InFlightChip",
        partNumber: "C123",
        description: "Online supplier part",
        package: "SOIC-8",
      },
    ]
    let finishOnlineLoad!: (tsx: string) => void
    fakeSupplier.pendingTsx = new Promise((resolve) => {
      finishOnlineLoad = resolve
    })
    const supplierProps = {
      isOpen: true,
      onClose: closed,
      onJlcpcbComponentTsxLoaded: supplierImport,
      onDatasheetComponentTsxLoaded: onlineProps.onDatasheetComponentTsxLoaded,
      platformConfig,
    }
    await act(async () =>
      root.render(<ImportComponentDialog2 {...supplierProps} />),
    )
    await search("InFlightChip")
    await select("InFlightChip")
    await act(async () => importButton().click())
    expect(fakeSupplier.loads).toEqual(["C123"])
    await act(async () =>
      root.render(
        <ImportComponentDialog2 {...supplierProps} cachedDatasheetImports />,
      ),
    )
    await act(async () =>
      finishOnlineLoad("export const InFlightChip = () => null"),
    )
    expect(supplierImports).toHaveLength(0)
    expect(document.body.textContent).toContain("Import source changed")
    expect(externalRequests).toHaveLength(0)

    for (const removeTransport of [false, true]) {
      let partReads = 0
      let finishPartRead!: (json: string) => void
      const delayedTransport = createCachedDatasheetFetch({
        readCacheFile: (path) => {
          if (path.endsWith("index.json"))
            return fakeCacheFiles.get(path) ?? null
          partReads++
          // The preview completes, while the subsequent import remains pending.
          if (partReads === 1) return fakeCacheFiles.get(path) ?? null
          return new Promise<string>((resolve) => {
            finishPartRead = resolve
          })
        },
      })
      const renderCached = (nextPlatformConfig?: PlatformConfig) => (
        <ImportComponentDialogForCli
          isOpen
          onClose={closed}
          cachedDatasheetImports
          platformConfig={nextPlatformConfig}
        />
      )
      await act(async () =>
        root.render(renderCached({ platformFetch: delayedTransport })),
      )
      await search("CachedChip")
      await select("CachedChip")
      await act(async () => importButton().click())
      expect(partReads).toBe(2)
      const replacementTransport = createCachedDatasheetFetch({
        readCacheFile: (path) => fakeCacheFiles.get(path) ?? null,
      })
      await act(async () =>
        root.render(
          renderCached(
            removeTransport
              ? undefined
              : { platformFetch: replacementTransport },
          ),
        ),
      )
      await act(async () => finishPartRead(JSON.stringify({ datasheet })))
      expect(fakeFileServer.writes).toHaveLength(1)
      expect(closeCount).toBe(1)
      expect(importButton().disabled).toBe(true)
      expect(document.body.textContent).toContain("Import source changed")
      expect(externalRequests).toHaveLength(0)
    }
  } finally {
    await act(async () => root.unmount())
    globalThis.fetch = previousFetch
    Object.assign(globalThis, previous, { IS_REACT_ACT_ENVIRONMENT: false })
    dom.window.close()
  }
})
