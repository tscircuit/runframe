import { expect, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import type { CadAssemblyBomItem } from "circuit-json"
import { BomTable } from "../../lib/components/BomTable"

const part = (
  name: string,
  extra: Partial<CadAssemblyBomItem> = {},
): CadAssemblyBomItem => ({
  type: "cad_assembly_bom_item",
  cad_assembly_bom_item_id: name,
  quantity: 1,
  name,
  ...extra,
})
const tick = () => new Promise((resolve) => setTimeout(resolve, 20))

test("collapse, source changes, quantity, links and circuit replacement", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "https://host.example/",
  })
  for (const key of [
    "window",
    "document",
    "HTMLElement",
    "HTMLInputElement",
    "Node",
    "Event",
    "MouseEvent",
  ])
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value: Reflect.get(dom.window, key),
    })
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
    configurable: true,
    value: true,
  })
  const root = createRoot(document.getElementById("root")!)
  const circuitJson = [
    part("Enclosure", {
      purchase_urls: [
        "https://amazon.com/dp/example",
        "https://store.example/enclosure",
      ],
    }),
    part("Regulator", {
      parent_cad_assembly_bom_item_id: "Enclosure",
      quantity: 2,
      supplier_part_numbers: { jlcpcb: ["C1", "C2"] },
      purchase_urls: ["https://store.example/regulator"],
    }),
  ]
  const calls: string[] = []
  const engine = {
    fetchPartAvailability: async ({
      supplierPartNumber,
    }: { supplierPartNumber: string }) => {
      calls.push(supplierPartNumber)
      return {
        price: supplierPartNumber === "C1" ? 1 : 3,
        currency: "USD",
        stock: 0,
      }
    },
  }
  try {
    await act(async () => {
      root.render(<BomTable circuitJson={circuitJson} partsEngine={engine} />)
      await tick()
    })
    await act(tick)
    expect(document.body.textContent?.replace(/\s/g, " ")).toContain("USD 2.00")
    expect(document.body.textContent?.replace(/\s/g, " ")).toContain(
      "1 unpriced",
    )
    expect(document.body.textContent?.replace(/\s/g, " ")).toContain(
      "0 in stock",
    )
    expect(
      document.querySelector<HTMLAnchorElement>(
        'a[aria-label="Purchase link 1 for Enclosure"]',
      )?.href,
    ).toBe("https://amazon.com/dp/example")
    await act(async () =>
      document
        .querySelector<HTMLButtonElement>(
          'button[aria-label="Collapse Enclosure"]',
        )!
        .click(),
    )
    expect(
      document.querySelector('select[aria-label="Source for Regulator"]'),
    ).toBeNull()
    expect(document.body.textContent?.replace(/\s/g, " ")).toContain("USD 2.00")
    await act(async () =>
      document
        .querySelector<HTMLButtonElement>(
          'button[aria-label="Expand Enclosure"]',
        )!
        .click(),
    )
    await act(async () => {
      const select = document.querySelector<HTMLSelectElement>(
        'select[aria-label="Source for Regulator"]',
      )!
      select.value = "1"
      select.dispatchEvent(new dom.window.Event("change", { bubbles: true }))
      await tick()
    })
    expect(document.body.textContent?.replace(/\s/g, " ")).toContain("USD 6.00")
    expect(calls).toContain("C2")
    expect(
      document.querySelector<HTMLAnchorElement>(
        'a[aria-label="Purchase link 2 for Enclosure"]',
      )?.href,
    ).toBe("https://store.example/enclosure")
    expect(
      document.querySelector<HTMLAnchorElement>(
        'a[aria-label="Purchase link 1 for Regulator"]',
      )?.href,
    ).toBe("https://store.example/regulator")
    const pending: Array<() => void> = []
    const slow = {
      fetchPartAvailability: async () => {
        await new Promise<void>((resolve) => pending.push(resolve))
        return { price: 999, currency: "USD", stock: 1 }
      },
    }
    await act(async () =>
      root.render(<BomTable circuitJson={circuitJson} partsEngine={slow} />),
    )
    await act(async () => {
      root.render(<BomTable circuitJson={[]} partsEngine={slow} />)
      await tick()
    })
    await act(async () => {
      pending.forEach((resolve) => resolve())
      await tick()
    })
    expect(document.body.textContent?.replace(/\s/g, " ")).toContain(
      "No BOM items",
    )
    expect(document.body.textContent).not.toContain("999")
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
  }
})
