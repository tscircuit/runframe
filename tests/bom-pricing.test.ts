import { expect, test } from "bun:test"
import type { AssemblyBomNode } from "circuit-json-to-bom-csv"
import {
  getBomCost,
  getProductUrl,
  getQuoteKey,
  loadBomQuotes,
  type BomQuotes,
} from "../lib/components/BomTable/bom-pricing"

const part = (id: string, supplier = "jlcpcb"): AssemblyBomNode => ({
  id,
  name: id,
  quantity: 1,
  total_quantity: 2,
  assembly_mode: "buy",
  included_in_purchase: true,
  children: [],
  sources: [{ supplier_name: supplier, supplier_part_number: id }],
})

test("BOM prices deduplicate requests and keep unsupported, failed and unknown distinct", async () => {
  const nodes = [
    part("same"),
    part("same"),
    part("unknown"),
    part("failed"),
    part("amazon", "amazon"),
  ]
  const calls: string[] = []
  const quotes: BomQuotes = {}
  await loadBomQuotes({
    nodes,
    selected: {},
    signal: new AbortController().signal,
    engine: {
      fetchPartAvailability: async ({ supplierPartNumber }) => {
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
  expect(quotes[getQuoteKey(nodes[3].sources[0])].status).toBe("error")
  expect(quotes[getQuoteKey(nodes[4].sources[0])].status).toBe("unsupported")
  expect(getBomCost(nodes, {}, quotes, 10)).toEqual({
    totals: { USD: 0 },
    unpriced: 3,
  })
})

test("rollups separate currencies, multiply quantities and exclude purchased children", () => {
  const usd = part("usd"),
    eur = part("eur"),
    unknown = part("unknown")
  const internal = { ...part("internal"), included_in_purchase: false }
  usd.children = [internal]
  const quotes: BomQuotes = {
    [getQuoteKey(usd.sources[0])]: {
      status: "ready",
      availability: { price: 1.5, currency: "USD", stock: 10 },
    },
    [getQuoteKey(eur.sources[0])]: {
      status: "ready",
      availability: { price: 2, currency: "EUR", stock: null },
    },
    [getQuoteKey(internal.sources[0])]: {
      status: "ready",
      availability: { price: 999, currency: "USD", stock: 0 },
    },
  }
  expect(getBomCost([usd, eur, unknown], {}, quotes, 3)).toEqual({
    totals: { USD: 9, EUR: 12 },
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

test("product links accept arbitrary stores but reject executable URLs", () => {
  expect(
    getProductUrl({
      supplier_name: "amazon",
      url: "https://amazon.com/dp/example",
    }),
  ).toBe("https://amazon.com/dp/example")
  expect(
    getProductUrl({ supplier_name: "store", url: "javascript:alert(1)" }),
  ).toBeUndefined()
  expect(
    getProductUrl({ supplier_name: "store", url: "data:text/html,test" }),
  ).toBeUndefined()
})
