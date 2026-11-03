import type {
  PartAvailability,
  PartsEngine,
  FetchPartAvailabilityParams,
} from "@tscircuit/props"
import type { AssemblyBomNode } from "circuit-json-to-bom-csv"

export type BomPriceEngine = Pick<PartsEngine, "fetchPartAvailability">
export type BomQuote =
  | { status: "ready"; availability: PartAvailability }
  | { status: "unsupported" | "error" }
export type BomQuotes = Record<string, BomQuote>
export type BomSelections = Record<string, number>
type PurchasingSource = AssemblyBomNode["sources"][number]

export const getSelectedSource = (
  node: AssemblyBomNode,
  selected: BomSelections,
) => node.sources[selected[node.id] ?? 0]
export const getQuoteKey = (source: PurchasingSource | undefined): string =>
  JSON.stringify([
    source?.supplier_name.trim().toLowerCase(),
    source?.supplier_part_number?.trim(),
  ])

export const getProductUrl = (source: PurchasingSource): string | undefined => {
  if (source.url) {
    try {
      const url = new URL(source.url)
      if (url.protocol === "https:" || url.protocol === "http:") return url.href
    } catch {}
    return
  }
  if (
    ["jlcpcb", "lcsc"].includes(source.supplier_name) &&
    source.supplier_part_number
  )
    return `https://jlcpcb.com/partdetail/${encodeURIComponent(source.supplier_part_number)}`
}

const getLookup = (
  source: PurchasingSource,
): FetchPartAvailabilityParams | undefined => {
  const supplierName = source.supplier_name.trim().toLowerCase()
  if (!source.supplier_part_number?.trim()) return
  // SupplierName is a closed engine API; arbitrary stores still retain their URLs.
  if (
    supplierName !== "jlcpcb" &&
    supplierName !== "macrofab" &&
    supplierName !== "pcbway" &&
    supplierName !== "digikey" &&
    supplierName !== "mouser" &&
    supplierName !== "lcsc"
  )
    return
  return {
    supplierName,
    supplierPartNumber: source.supplier_part_number.trim(),
  }
}

export const getPurchasableNodes = (
  nodes: AssemblyBomNode[],
): AssemblyBomNode[] =>
  nodes.flatMap((node) =>
    !node.included_in_purchase
      ? []
      : node.assembly_mode === "buy"
        ? [node]
        : getPurchasableNodes(node.children),
  )

/** Deduplicated lookups, bounded to six concurrent requests, cancellable on edits. */
export const loadBomQuotes = async ({
  nodes,
  selected,
  engine,
  signal,
  onQuote,
}: {
  nodes: AssemblyBomNode[]
  selected: BomSelections
  engine: BomPriceEngine
  signal: AbortSignal
  onQuote: (key: string, quote: BomQuote) => void
}) => {
  const sources = new Map<string, PurchasingSource>()
  for (const node of getPurchasableNodes(nodes)) {
    const source = getSelectedSource(node, selected)
    if (source) sources.set(getQuoteKey(source), source)
  }
  const pending = [...sources.entries()]
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(6, pending.length) }, async () => {
      while (!signal.aborted && next < pending.length) {
        const [key, source] = pending[next++]!
        const lookup = getLookup(source)
        let quote: BomQuote
        try {
          const availability =
            lookup && engine.fetchPartAvailability
              ? await engine.fetchPartAvailability({ ...lookup, signal })
              : undefined
          quote = availability
            ? { status: "ready", availability }
            : { status: "unsupported" }
        } catch {
          quote = { status: "error" }
        }
        if (!signal.aborted) onQuote(key, quote)
      }
    }),
  )
}

export const getBomCost = (
  nodes: AssemblyBomNode[],
  selected: BomSelections,
  quotes: BomQuotes,
  buildQuantity: number,
) => {
  const totals: Record<string, number> = {}
  let unpriced = 0
  for (const node of getPurchasableNodes(nodes)) {
    const quote = quotes[getQuoteKey(getSelectedSource(node, selected))]
    const availability =
      quote?.status === "ready" ? quote.availability : undefined
    if (!isPriced(availability)) {
      unpriced++
      continue
    }
    totals[availability.currency] =
      (totals[availability.currency] ?? 0) +
      availability.price * node.total_quantity * buildQuantity
  }
  return { totals, unpriced }
}

export const isPriced = (
  availability: PartAvailability | undefined,
): availability is PartAvailability & { price: number; currency: string } =>
  availability?.price != null &&
  Number.isFinite(availability.price) &&
  availability.price >= 0 &&
  !!availability.currency &&
  /^[A-Z]{3}$/.test(availability.currency)

export const formatBomMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 4,
  }).format(amount)
