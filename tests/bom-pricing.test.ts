import { expect, test } from "bun:test"
import type { SupplierName } from "circuit-json"
import type { AssemblyBomNode } from "circuit-json-to-bom-csv"
import {
  getBomCost,
  getProductUrl,
  getPurchaseUrl,
  getSelectedSource,
  getSupplierOptions,
  getQuoteKey,
  loadBomQuotes,
  type BomQuotes,
} from "../lib/components/BomTable/bom-pricing"

const part = (
  id: string,
  supplier: SupplierName = "jlcpcb",
): AssemblyBomNode => ({
  id,
  name: id,
  quantity: 1,
  total_quantity: 2,
  kind: "assembly_bom_item",
  purchase_urls: [],
  children: [],
  supplier_part_numbers: { [supplier]: [id] },
})

test("BOM prices deduplicate requests and keep unsupported, failed and unknown distinct", async () => {
  const nodes = [
    part("same"),
    part("same"),
    part("unknown"),
    part("failed"),
    part("unsupported", "mouser"),
    {
      ...part("amazon"),
      supplier_part_numbers: undefined,
      purchase_urls: ["https://amazon.com/dp/example"],
    },
  ]
  const calls: string[] = []
  const quotes: BomQuotes = {}
  await loadBomQuotes({
    nodes,
    selected: {},
    signal: new AbortController().signal,
    engine: {
      fetchPartAvailability: async ({ supplierName, supplierPartNumber }) => {
        if (supplierName === "mouser") return undefined
        calls.push(supplierPartNumber)
        if (supplierPartNumber === "failed") throw new Error("offline")
        return {
          price: supplierPartNumber === "unknown" ? null : 0,
          currency: "USD",
          stock: 0,
        }
      },
    },
    onQuote: (key, value) => {
      quotes[key] = value
    },
  })
  expect(calls.sort()).toEqual(["failed", "same", "unknown"])
  expect(quotes[getQuoteKey(getSelectedSource(nodes[3], {}))].status).toBe(
    "error",
  )
  expect(quotes[getQuoteKey(getSelectedSource(nodes[4], {}))].status).toBe(
    "unsupported",
  )
  expect(getBomCost(nodes, {}, quotes, 10)).toEqual({
    totals: { USD: 0 },
    unpriced: 4,
  })
})

test("rollups separate currencies and count parent and child materials once, excluding structural groups", () => {
  const usd = part("usd"),
    eur = part("eur"),
    unknown = part("unknown")
  const internal = part("internal")
  usd.children = [internal]
  const quotes: BomQuotes = {
    [getQuoteKey(getSelectedSource(usd, {}))]: {
      status: "ready",
      availability: { price: 1.5, currency: "USD", stock: 10 },
    },
    [getQuoteKey(getSelectedSource(eur, {}))]: {
      status: "ready",
      availability: { price: 2, currency: "EUR", stock: null },
    },
    [getQuoteKey(getSelectedSource(internal, {}))]: {
      status: "ready",
      availability: { price: 0.5, currency: "USD", stock: 0 },
    },
  }
  expect(
    getBomCost(
      [{ ...part("group"), kind: "subcircuit", children: [usd, eur, unknown] }],
      {},
      quotes,
      3,
    ),
  ).toEqual({
    totals: { USD: 12, EUR: 12 },
    unpriced: 1,
  })
})

test("cancellation suppresses stale quotes and bounds parallel requests", async () => {
  const controller = new AbortController()
  let active = 0,
    maximum = 0,
    received = 0
  const pending: Array<() => void> = []
  const load = loadBomQuotes({
    nodes: Array.from({ length: 20 }, (_, i) => part(String(i))),
    selected: {},
    signal: controller.signal,
    engine: {
      fetchPartAvailability: async () => {
        active++
        maximum = Math.max(maximum, active)
        await new Promise<void>((resolve) => pending.push(resolve))
        active--
        return { price: 1, currency: "USD", stock: 1 }
      },
    },
    onQuote: () => {
      received++
    },
  })
  expect(maximum).toBe(6)
  controller.abort()
  pending.forEach((resolve) => resolve())
  await load
  expect(received).toBe(0)
  expect(pending.length).toBe(6)
})

test("purchase links are independent of supplier selection and reject executable URLs", () => {
  const node = {
    ...part("alternatives"),
    supplier_part_numbers: { jlcpcb: ["C1", "C2"], mouser: ["ALT"] },
    purchase_urls: [
      "https://amazon.com/dp/example",
      "https://store.example/product",
    ],
  }
  expect(getSupplierOptions(node)).toHaveLength(3)
  expect(getSelectedSource(node, { alternatives: 1 })).toEqual({
    supplierName: "jlcpcb",
    supplierPartNumber: "C2",
  })
  expect(getSelectedSource(node, { alternatives: 999 })).toEqual(
    getSelectedSource(node, {}),
  )
  expect(node.purchase_urls.map(getPurchaseUrl)).toEqual(node.purchase_urls)
  expect(getPurchaseUrl("javascript:alert(1)")).toBeUndefined()
  expect(getPurchaseUrl("data:text/html,test")).toBeUndefined()
  expect(
    getProductUrl({ supplierName: "jlcpcb", supplierPartNumber: "C1" }),
  ).toBe("https://jlcpcb.com/partdetail/C1")
  expect(
    getProductUrl({ supplierName: "lcsc", supplierPartNumber: "C1" }),
  ).toBeUndefined()
})
