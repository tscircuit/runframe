import { afterEach, beforeEach, expect, test } from "bun:test"
import { createCachedDatasheetFetch } from "../lib/optional-features/importing/datasheet-catalog/create-cached-datasheet-fetch"
import { createLocalDatasheetCatalog } from "../lib/optional-features/importing/datasheet-catalog/catalog"

const id = "11111111-1111-1111-1111-111111111111"
const record = {
  datasheet_id: id,
  chip_name: "CachedChip",
  footprinter_string: "soic2",
  pin_information: [
    { pin_number: "1", name: ["VCC"] },
    { pin_number: "2", name: ["GND"] },
  ],
}
const originalFetch = globalThis.fetch
let externalRequests: RequestInfo[]
beforeEach(() => {
  externalRequests = []
  globalThis.fetch = (async (input: RequestInfo) => {
    externalRequests.push(input)
    throw new Error("External networking is disabled")
  }) as typeof fetch
})
afterEach(() => {
  globalThis.fetch = originalFetch
  expect(externalRequests).toHaveLength(0)
})

const createCatalog = (files: Record<string, unknown>) =>
  createLocalDatasheetCatalog({
    platformFetch: createCachedDatasheetFetch({
      readCacheFile: (path) =>
        path in files ? JSON.stringify(files[path]) : null,
    }),
  })

test("local search and selected imports use cached API envelopes without supplier requests", async () => {
  const catalog = createCatalog({
    ".cache/datasheets/index.json": {
      datasheets: [
        {
          datasheet_id: id,
          chip_name: "CachedChip",
          ai_description: "Low power controller",
        },
        {
          datasheet_id: "22222222-2222-2222-2222-222222222222",
          chip_name: "CachedChipB",
        },
      ],
    },
    ".cache/datasheets/parts/cachedchip.json": { datasheet: record },
  })
  const results = await catalog.search("Cached Chip")
  expect(results.map((entry) => entry.chip_name)).toEqual([
    "CachedChip",
    "CachedChipB",
  ])
  expect(await catalog.search("controller")).toHaveLength(1)
  expect(await catalog.search("CachedChip", 1)).toHaveLength(1)
  expect(await catalog.search("unknown")).toEqual([])
  expect(await catalog.search(" ")).toEqual([])
  const component = await catalog.loadComponent(results[0]!)
  expect(component.componentName).toBe("CachedChip")
  expect(component.tsx).toContain('footprint={"soic2"}')
  expect(
    component.footprintCircuitJson.filter((item) => item.type === "pcb_smtpad"),
  ).toHaveLength(2)
})

test("missing, malformed and mismatched cached parts fail without remote fallback", async () => {
  const entry = { datasheet_id: id, chip_name: "CachedChip" }
  await expect(createCatalog({}).search("chip")).rejects.toThrow("index.json")
  await expect(createCatalog({}).loadComponent(entry)).rejects.toThrow(
    "parts/cachedchip.json",
  )
  await expect(
    createCatalog({
      ".cache/datasheets/parts/cachedchip.json": {
        datasheet: {
          ...record,
          datasheet_id: "22222222-2222-2222-2222-222222222222",
        },
      },
    }).loadComponent(entry),
  ).rejects.toThrow("does not match selected part")
  await expect(
    createCatalog({
      ".cache/datasheets/parts/cachedchip.json": {
        datasheet: { ...record, footprinter_string: null },
      },
    }).loadComponent(entry),
  ).rejects.toThrow("footprinter_string")
})

test("corrupt catalog entries and duplicate normalized identities are rejected", async () => {
  for (const index of [
    null,
    { datasheets: [{}] },
    { datasheets: [{ datasheet_id: id, chip_name: "chip", description: 1 }] },
    {
      datasheets: [
        { datasheet_id: id, chip_name: "CHIP.1" },
        {
          datasheet_id: "22222222-2222-2222-2222-222222222222",
          chip_name: "chip1",
        },
      ],
    },
  ]) {
    await expect(
      createCatalog({ ".cache/datasheets/index.json": index }).search("chip"),
    ).rejects.toThrow("cached datasheet")
  }
})

test("requires an explicit transport and reports cache HTTP errors", async () => {
  expect(() =>
    createLocalDatasheetCatalog({
      platformFetch: undefined as unknown as typeof fetch,
    }),
  ).toThrow("platformConfig.platformFetch")
  const cacheRequests: string[] = []
  const catalog = createLocalDatasheetCatalog({
    platformFetch: (async (input: RequestInfo | URL) => {
      cacheRequests.push(input instanceof Request ? input.url : String(input))
      return new Response(null, { status: 404 })
    }) as typeof fetch,
  })
  await expect(catalog.search("chip")).rejects.toThrow("404")
  expect(cacheRequests).toEqual(["https://api.tscircuit.com/datasheets/list"])
  await expect(catalog.search("chip", 0)).rejects.toThrow("search limit")
})
