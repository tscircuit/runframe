import { describe, expect, it } from "bun:test"
import {
  clearConverterModuleCache,
  loadConverterModule,
} from "./dynamic-converters"

describe("dynamic converter loading", () => {
  it("caches successful loads and clears failed loads for retry", async () => {
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
      loadConverterModule("circuit-json-to-bom-csv", successfulImporter),
      loadConverterModule("circuit-json-to-bom-csv", successfulImporter),
    ])

    expect(firstLoad).toBe(secondLoad)
    expect(importedSpecifiers).toEqual([
      "https://cdn.jsdelivr.net/npm/circuit-json-to-bom-csv@0.0.8/+esm",
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
      loadConverterModule("circuit-json-to-bom-csv", flakyImporter),
    ).rejects.toThrow("temporary CDN failure")

    await expect(
      loadConverterModule("circuit-json-to-bom-csv", flakyImporter),
    ).resolves.toEqual({
      convertCircuitJsonToBomRows: expect.any(Function),
      convertBomRowsToCsv: expect.any(Function),
    })
    expect(attempts).toBe(2)

    clearConverterModuleCache()
  })
})
