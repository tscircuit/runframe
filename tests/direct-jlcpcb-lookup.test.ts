import { describe, expect, test } from "bun:test"
import {
  addDirectJlcpcbLookupResult,
  createDirectJlcpcbLookupResult,
} from "../lib/components/ImportComponentDialog2/direct-jlcpcb-lookup"
import type { JlcpcbComponentSearchResult } from "../lib/components/ImportComponentDialog2/types"

describe("direct JLCPCB lookup", () => {
  test("creates a direct result for an exact LCSC part number", () => {
    expect(createDirectJlcpcbLookupResult(" c5264268 ")).toEqual({
      source: "jlcpcb",
      component: {
        lcscId: 5264268,
        manufacturer: "C5264268",
        partNumber: "C5264268",
        description:
          "Import directly from EasyEDA; stock and availability are unknown",
        package: "",
        isDirectLookup: true,
      },
    })
  })

  test("does not create direct results for general searches", () => {
    expect(createDirectJlcpcbLookupResult("ISP1807-LR-RS")).toBeNull()
    expect(createDirectJlcpcbLookupResult("5264268")).toBeNull()
    expect(createDirectJlcpcbLookupResult("C5264268 extra")).toBeNull()
  })

  test("adds a direct fallback when JLCSearch omits the exact part", () => {
    const results = addDirectJlcpcbLookupResult("C5264268", [])

    expect(results).toHaveLength(1)
    expect(results[0]?.component.partNumber).toBe("C5264268")
    expect(results[0]?.component.isDirectLookup).toBe(true)
  })

  test("does not duplicate a part returned by JLCSearch", () => {
    const catalogResult: JlcpcbComponentSearchResult = {
      source: "jlcpcb",
      component: {
        lcscId: 14663,
        manufacturer: "RC0603FR-0710KL",
        partNumber: "C14663",
        description: "10k resistor",
        package: "0603",
        stock: 100,
      },
    }

    expect(addDirectJlcpcbLookupResult("C14663", [catalogResult])).toEqual([
      catalogResult,
    ])
  })
})
