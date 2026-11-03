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
// Pricing options come only from supplier identifiers, never from purchase URLs.
export const getSupplierOptions = (
  node: AssemblyBomNode,
): FetchPartAvailabilityParams[] =>
  Object.entries(node.supplier_part_numbers ?? {}).flatMap(
    ([supplierName, numbers]) =>
      (numbers ?? []).map((supplierPartNumber) => ({
        supplierName:
          supplierName as FetchPartAvailabilityParams["supplierName"],
        supplierPartNumber,
      })),
  )

export const getSelectedSource = (
  node: AssemblyBomNode,
  selected: BomSelections,
) => {
  const options = getSupplierOptions(node)
  return options[selected[node.id] ?? 0] ?? options[0]
}
export const getQuoteKey = (
  source: FetchPartAvailabilityParams | undefined,
): string => JSON.stringify([source?.supplierName, source?.supplierPartNumber])

export const getPurchaseUrl = (value: string): string | undefined => {
  try {
    const url = new URL(value)
    if (url.protocol === "https:" || url.protocol === "http:") return url.href
  } catch {}
}

export const getProductUrl = (
  source: FetchPartAvailabilityParams,
): string | undefined => {
  if (source.supplierName === "jlcpcb")
    return `https://jlcpcb.com/partdetail/${encodeURIComponent(source.supplierPartNumber)}`
}

/** Each material line counts once; subcircuits are structural display groups. */
export const getMaterialNodes = (nodes: AssemblyBomNode[]): AssemblyBomNode[] =>
  nodes.flatMap((node) => [
    ...(node.kind === "subcircuit" ? [] : [node]),
    ...getMaterialNodes(node.children),
  ])

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
  const sources = new Map<string, FetchPartAvailabilityParams>()
  for (const node of getMaterialNodes(nodes)) {
    const source = getSelectedSource(node, selected)
    if (source) sources.set(getQuoteKey(source), source)
  }
  const pending = [...sources.entries()]
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(6, pending.length) }, async () => {
      while (!signal.aborted && next < pending.length) {
        const [key, source] = pending[next++]!
        const lookup = source
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
  for (const node of getMaterialNodes(nodes)) {
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
