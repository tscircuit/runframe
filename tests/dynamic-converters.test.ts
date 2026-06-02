import { describe, expect, test, beforeEach } from "bun:test"
import {
  getConverterCdnUrl,
  loadConverterModule,
  clearConverterModuleCache,
  type ConverterPackageName,
  type ConverterModuleImporter,
} from "../lib/optional-features/exporting/dynamic-converters"

describe("dynamic converter CDN URLs", () => {
  test("all converter packages have pinned jsdelivr ESM URLs", () => {
    const packages: ConverterPackageName[] = [
      "circuit-json-to-gerber",
      "circuit-json-to-bom-csv",
      "circuit-json-to-pnp-csv",
      "circuit-json-to-kicad",
      "circuit-json-to-gltf",
      "circuit-json-to-step",
      "circuit-json-to-lbrn",
    ]

    for (const pkg of packages) {
      const url = getConverterCdnUrl(pkg)
      expect(url).toStartWith("https://cdn.jsdelivr.net/npm/")
      expect(url).toEndWith("/+esm")
      // Must have pinned version (no @latest)
      expect(url).not.toContain("@latest")
      // Must contain the package name
      expect(url).toContain(pkg)
    }
  })

  test("URLs contain specific version pins", () => {
    const url = getConverterCdnUrl("circuit-json-to-gerber")
    // Should match pattern: @X.Y.Z
    expect(url).toMatch(/@\d+\.\d+\.\d+/)
  })
})

describe("dynamic converter loading", () => {
  beforeEach(() => {
    clearConverterModuleCache()
    delete globalThis.tscircuitDynamicModules
  })

  test("caches successful loads (only imports once)", async () => {
    const importedSpecifiers: string[] = []
    const mockImporter: ConverterModuleImporter = async <TModule>(
      specifier: string,
    ) => {
      importedSpecifiers.push(specifier)
      return {
        convertCircuitJsonToBomRows: () => [],
        convertBomRowsToCsv: () => "",
      } as TModule
    }

    const [first, second] = await Promise.all([
      loadConverterModule("circuit-json-to-bom-csv", mockImporter),
      loadConverterModule("circuit-json-to-bom-csv", mockImporter),
    ])

    expect(first).toBe(second)
    // Only one import call despite two concurrent loads
    expect(importedSpecifiers).toHaveLength(1)
    expect(importedSpecifiers[0]).toBe(
      getConverterCdnUrl("circuit-json-to-bom-csv"),
    )
  })

  test("clears cache on failure so retry can succeed", async () => {
    let attempts = 0
    const flakyImporter: ConverterModuleImporter = async <TModule>() => {
      attempts += 1
      if (attempts === 1) throw new Error("CDN timeout")
      return {
        convertCircuitJsonToBomRows: () => [],
        convertBomRowsToCsv: () => "",
      } as TModule
    }

    // First call fails
    await expect(
      loadConverterModule("circuit-json-to-bom-csv", flakyImporter),
    ).rejects.toThrow("CDN timeout")

    // Second call retries and succeeds
    const mod = await loadConverterModule(
      "circuit-json-to-bom-csv",
      flakyImporter,
    )
    expect(mod).toBeDefined()
    expect(mod.convertCircuitJsonToBomRows).toBeFunction()
    expect(attempts).toBe(2)
  })

  test("clearConverterModuleCache resets all cached modules", async () => {
    let calls = 0
    const countingImporter: ConverterModuleImporter = async <TModule>() => {
      calls += 1
      return {
        stringifyGerberCommandLayers: () => ({}),
        convertSoupToGerberCommands: () => ({}),
        convertSoupToExcellonDrillCommands: () => ({}),
        stringifyExcellonDrill: () => "",
      } as TModule
    }

    await loadConverterModule("circuit-json-to-gerber", countingImporter)
    expect(calls).toBe(1)

    // Cached — no new import
    await loadConverterModule("circuit-json-to-gerber", countingImporter)
    expect(calls).toBe(1)

    // Clear cache — forces re-import
    clearConverterModuleCache()
    await loadConverterModule("circuit-json-to-gerber", countingImporter)
    expect(calls).toBe(2)
  })

  test("registers loaded modules for converter dependencies that use the legacy registry", async () => {
    const mockGltfModule = {
      convertCircuitJsonToGltf: () => new ArrayBuffer(0),
    }
    const mockImporter: ConverterModuleImporter = async <TModule>() =>
      mockGltfModule as TModule

    const mod = await loadConverterModule("circuit-json-to-gltf", mockImporter)

    expect(mod).toBe(mockGltfModule)
    expect(globalThis.tscircuitDynamicModules).toBeDefined()
    expect(globalThis.tscircuitDynamicModules?.["circuit-json-to-gltf"]).toBe(
      mockGltfModule,
    )
  })
})

describe("no static converter imports in export paths", () => {
  test("export files do not statically import converter packages", async () => {
    const fs = await import("node:fs")
    const path = await import("node:path")

    const exportsDir = path.join(
      import.meta.dir,
      "../lib/optional-features/exporting/formats",
    )

    const files = fs.readdirSync(exportsDir).filter((f) => f.endsWith(".ts"))

    const converterPackages = [
      "circuit-json-to-gerber",
      "circuit-json-to-bom-csv",
      "circuit-json-to-pnp-csv",
      "circuit-json-to-kicad",
      "circuit-json-to-gltf",
      "circuit-json-to-step",
      "circuit-json-to-lbrn",
    ]

    for (const file of files) {
      const content = fs.readFileSync(path.join(exportsDir, file), "utf-8")
      for (const pkg of converterPackages) {
        const hasStaticImport =
          content.includes(`from "${pkg}"`) || content.includes(`from '${pkg}'`)
        expect(hasStaticImport).toBe(false)
      }
    }
  })

  test("BomTable does not statically import converter packages", async () => {
    const fs = await import("node:fs")
    const path = await import("node:path")

    const bomDir = path.join(import.meta.dir, "../lib/components/BomTable")
    const files = fs
      .readdirSync(bomDir)
      .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))

    for (const file of files) {
      const content = fs.readFileSync(path.join(bomDir, file), "utf-8")
      const hasStaticImport =
        content.includes(`from "circuit-json-to-bom-csv"`) ||
        content.includes(`from 'circuit-json-to-bom-csv'`)
      expect(hasStaticImport).toBe(false)
    }
  })
})
