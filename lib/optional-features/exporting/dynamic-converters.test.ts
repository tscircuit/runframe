import { describe, expect, test } from "bun:test"
import {
  clearConverterModuleCache,
  getConverterCdnUrl,
  getConverterImportSpecifier,
  loadConverterModule,
} from "./dynamic-converters"

describe("dynamic converter loading", () => {
  test("uses pinned jsDelivr ESM URLs in browser builds", () => {
    expect(getConverterCdnUrl("circuit-json-to-gerber")).toBe(
      "https://cdn.jsdelivr.net/npm/circuit-json-to-gerber@0.0.78/+esm",
    )
    expect(getConverterCdnUrl("circuit-json-to-bom-csv")).toBe(
      "https://cdn.jsdelivr.net/npm/circuit-json-to-bom-csv@0.0.9/+esm",
    )
    expect(getConverterCdnUrl("circuit-json-to-pnp-csv")).toBe(
      "https://cdn.jsdelivr.net/npm/circuit-json-to-pnp-csv@0.0.7/+esm",
    )
    expect(getConverterCdnUrl("circuit-json-to-kicad")).toBe(
      "https://cdn.jsdelivr.net/npm/circuit-json-to-kicad@0.0.155/+esm",
    )
    expect(getConverterCdnUrl("circuit-json-to-gltf")).toBe(
      "https://cdn.jsdelivr.net/npm/circuit-json-to-gltf@0.0.105/+esm",
    )
    expect(getConverterCdnUrl("circuit-json-to-step")).toBe(
      "https://cdn.jsdelivr.net/npm/circuit-json-to-step@0.0.36/+esm",
    )
    expect(getConverterCdnUrl("circuit-json-to-lbrn")).toBe(
      "https://cdn.jsdelivr.net/npm/circuit-json-to-lbrn@0.0.74/+esm",
    )
  })

  test("keeps package specifiers for node-side fallback imports", () => {
    expect(getConverterImportSpecifier("circuit-json-to-step", "node")).toBe(
      "circuit-json-to-step",
    )
    expect(getConverterImportSpecifier("circuit-json-to-step", "browser")).toBe(
      "https://cdn.jsdelivr.net/npm/circuit-json-to-step@0.0.36/+esm",
    )
  })

  test("caches successful loads and clears failed loads for retry", async () => {
    clearConverterModuleCache()

    const importedSpecifiers: string[] = []
    const successfulImporter = async <TModule>(specifier: string) => {
      importedSpecifiers.push(specifier)
      return {
        convertCircuitJsonToBomRows: () => [],
        convertBomRowsToCsv: () => "",
      } as TModule
    }

    const [firstLoad, secondLoad] = await Promise.all([
      loadConverterModule("circuit-json-to-bom-csv", {
        importer: successfulImporter,
        runtime: "browser",
      }),
      loadConverterModule("circuit-json-to-bom-csv", {
        importer: successfulImporter,
        runtime: "browser",
      }),
    ])

    expect(firstLoad).toBe(secondLoad)
    expect(importedSpecifiers).toEqual([
      "https://cdn.jsdelivr.net/npm/circuit-json-to-bom-csv@0.0.9/+esm",
    ])

    clearConverterModuleCache()

    let attempts = 0
    const flakyImporter = async <TModule>() => {
      attempts += 1
      if (attempts === 1) throw new Error("temporary CDN failure")
      return {
        convertCircuitJsonToBomRows: () => [],
        convertBomRowsToCsv: () => "",
      } as TModule
    }

    await expect(
      loadConverterModule("circuit-json-to-bom-csv", {
        importer: flakyImporter,
      }),
    ).rejects.toThrow("temporary CDN failure")

    await expect(
      loadConverterModule("circuit-json-to-bom-csv", {
        importer: flakyImporter,
      }),
    ).resolves.toEqual({
      convertCircuitJsonToBomRows: expect.any(Function),
      convertBomRowsToCsv: expect.any(Function),
    })
    expect(attempts).toBe(2)

    clearConverterModuleCache()
  })
})
