import type { AssemblyBomNode } from "circuit-json-to-bom-csv"
import { Fragment, useEffect, useState } from "react"
import type { ReactNode } from "react"
import type { BomTableProps } from "./bom-table.types"
import {
  formatBomMoney,
  getBomCost,
  getProductUrl,
  getPurchaseUrl,
  getSupplierOptions,
  getQuoteKey,
  getSelectedSource,
  isPriced,
  loadBomQuotes,
  type BomQuotes,
  type BomSelections,
} from "./bom-pricing"

declare global {
  interface Window {
    TSCIRCUIT_JLCSEARCH_BASE_URL?: string
  }
}

export const BomTable = ({ circuitJson, partsEngine }: BomTableProps) => {
  const [model, setModel] = useState<{
    circuitJson: BomTableProps["circuitJson"]
    nodes: AssemblyBomNode[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<BomSelections>({})
  const [quotes, setQuotes] = useState<BomQuotes>({})
  const [buildQuantity, setBuildQuantity] = useState(1)
  const [refresh, setRefresh] = useState(0)
  const nodes = model?.circuitJson === circuitJson ? model.nodes : null

  useEffect(() => {
    let cancelled = false
    setError(null)
    setQuotes({})
    setSelected({})
    setCollapsed(new Set())
    // Resolve the pinned package lazily; the shared CDN can serve an older API.
    import("circuit-json-to-bom-csv")
      .then(({ convertCircuitJsonToAssemblyBom }) =>
        convertCircuitJsonToAssemblyBom({ circuitJson }),
      )
      .then((nodes) => {
        if (!cancelled) setModel({ circuitJson, nodes })
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Unable to load BOM")
      })
    return () => {
      cancelled = true
    }
  }, [circuitJson])

  useEffect(() => {
    if (!nodes) return
    const controller = new AbortController()
    setQuotes({})
    const update = async () => {
      try {
        const engine =
          partsEngine ??
          new (await import("@tscircuit/parts-engine")).JlcPcbPartsEngine({
            jlcSearchBaseUrl:
              typeof window === "undefined"
                ? undefined
                : window.TSCIRCUIT_JLCSEARCH_BASE_URL,
          })
        if (controller.signal.aborted) return
        await loadBomQuotes({
          nodes,
          selected,
          engine,
          signal: controller.signal,
          onQuote: (key, quote) =>
            setQuotes((previous) => ({ ...previous, [key]: quote })),
        })
      } catch {
        if (!controller.signal.aborted) {
          const failed: BomQuotes = {}
          const visit = (entries: AssemblyBomNode[]) =>
            entries.forEach((node) => {
              failed[getQuoteKey(getSelectedSource(node, selected))] = {
                status: "error",
              }
              visit(node.children)
            })
          visit(nodes)
          setQuotes(failed)
        }
      }
    }
    void update()
    return () => controller.abort()
  }, [nodes, partsEngine, selected, refresh])

  if (error)
    return (
      <div role="alert" className="rf-p-4 rf-text-sm">
        Unable to load BOM: {error}
      </div>
    )
  if (!nodes)
    return (
      <div className="rf-p-4 rf-text-sm rf-text-muted-foreground">
        Loading BOM...
      </div>
    )

  const costLabel = (entries: AssemblyBomNode[]) => {
    const cost = getBomCost(entries, selected, quotes, buildQuantity)
    const values = Object.entries(cost.totals).map(([currency, total]) =>
      formatBomMoney(total, currency),
    )
    if (!values.length) return cost.unpriced ? `${cost.unpriced} unpriced` : "—"
    return `${values.join(" + ")}${cost.unpriced ? ` + ${cost.unpriced} unpriced` : ""}`
  }
  const renderNode = (node: AssemblyBomNode, depth: number): ReactNode => {
    const source = getSelectedSource(node, selected)
    const quote = source ? quotes[getQuoteKey(source)] : undefined
    const availability =
      quote?.status === "ready" ? quote.availability : undefined
    const url = source && getProductUrl(source)
    const options = getSupplierOptions(node)
    const purchaseUrls = node.purchase_urls
      .map(getPurchaseUrl)
      .filter((url): url is string => !!url)
    const isMaterial = node.kind !== "subcircuit"
    const status = !isMaterial
      ? "Subcircuit"
      : !source
        ? "No supplier part number"
        : !quote
          ? "Checking…"
          : quote.status === "error"
            ? "Lookup failed"
            : quote.status === "unsupported"
              ? "Price unavailable"
              : availability?.stock == null
                ? "Stock unknown"
                : `${availability.stock} in stock`
    return (
      <Fragment key={node.id}>
        <tr
          className={`rf-border-b ${node.children.length ? "rf-bg-muted/50" : ""}`}
        >
          <td className="rf-p-2" style={{ paddingLeft: 8 + depth * 20 }}>
            {node.children.length > 0 ? (
              <button
                type="button"
                aria-expanded={!collapsed.has(node.id)}
                aria-label={`${collapsed.has(node.id) ? "Expand" : "Collapse"} ${node.name}`}
                className="rf-mr-2 rf-p-1"
                onClick={() =>
                  setCollapsed((previous) => {
                    const next = new Set(previous)
                    if (next.has(node.id)) next.delete(node.id)
                    else next.add(node.id)
                    return next
                  })
                }
              >
                {collapsed.has(node.id) ? "▸" : "▾"}
              </button>
            ) : null}
            {node.name}
            {node.row?.comment ? (
              <div className="rf-text-xs rf-text-muted-foreground">
                {node.row.comment}
              </div>
            ) : null}
          </td>
          <td className="rf-p-2 rf-text-right">
            {node.total_quantity * buildQuantity}
          </td>
          <td className="rf-p-2">{node.row?.value || "—"}</td>
          <td className="rf-p-2">{node.row?.footprint || "—"}</td>
          <td className="rf-p-2">
            {source ? (
              <>
                {options.length > 1 ? (
                  <select
                    aria-label={`Source for ${node.name}`}
                    className="rf-max-w-48 rf-border rf-rounded rf-p-1 rf-bg-background"
                    value={selected[node.id] ?? 0}
                    onChange={(event) =>
                      setSelected((previous) => ({
                        ...previous,
                        [node.id]: Number(event.target.value),
                      }))
                    }
                  >
                    {options.map((option, index) => (
                      <option key={index} value={index}>
                        {option.supplierName}
                        {option.supplierPartNumber
                          ? ` · ${option.supplierPartNumber}`
                          : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span>
                    {source.supplierName}
                    {source.supplierPartNumber
                      ? ` · ${source.supplierPartNumber}`
                      : ""}
                  </span>
                )}
                {url ? (
                  <a
                    className="rf-ml-2 rf-text-blue-500 rf-underline"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open product for ${node.name}`}
                  >
                    Product ↗
                  </a>
                ) : null}
              </>
            ) : purchaseUrls.length ? null : (
              "—"
            )}
            {purchaseUrls.map((purchaseUrl, index) => (
              <a
                key={purchaseUrl}
                className="rf-block rf-text-blue-500 rf-underline"
                href={purchaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Purchase link ${index + 1} for ${node.name}`}
              >
                {new URL(purchaseUrl).hostname.replace(/^www\./, "")} ↗
              </a>
            ))}
          </td>
          <td className="rf-p-2 rf-text-right rf-whitespace-nowrap">
            {isMaterial && isPriced(availability)
              ? formatBomMoney(availability.price, availability.currency)
              : "—"}
          </td>
          <td className="rf-p-2 rf-text-right rf-whitespace-nowrap">
            {costLabel([node])}
          </td>
          <td className="rf-p-2 rf-text-xs">
            {status}
            {isMaterial && availability?.checkedAt ? (
              <div className="rf-text-muted-foreground">
                Checked {availability.checkedAt}
              </div>
            ) : null}
          </td>
        </tr>
        {!collapsed.has(node.id)
          ? node.children.map((child) => renderNode(child, depth + 1))
          : null}
      </Fragment>
    )
  }

  return (
    <div>
      <div className="rf-flex rf-flex-wrap rf-items-center rf-gap-4 rf-p-2">
        <label className="rf-text-sm">
          Build quantity{" "}
          <input
            aria-label="Build quantity"
            type="number"
            min={1}
            max={100000}
            step={1}
            value={buildQuantity}
            className="rf-w-24 rf-rounded rf-border rf-bg-background rf-p-1"
            onChange={(event) => {
              const value = event.target.valueAsNumber
              if (Number.isSafeInteger(value) && value >= 1 && value <= 100000)
                setBuildQuantity(value)
            }}
          />
        </label>
        <button
          type="button"
          className="rf-rounded rf-border rf-p-1 rf-text-sm"
          onClick={() => setRefresh((value) => value + 1)}
        >
          Refresh prices
        </button>
      </div>
      <div className="rf-overflow-x-auto">
        <table className="rf-w-full rf-text-left rf-text-sm">
          <thead>
            <tr className="rf-border-b">
              {[
                "Item / reference",
                "Qty",
                "Value",
                "Footprint",
                "Supplier / purchase links",
                "Unit estimate",
                "Subtotal",
                "Availability",
              ].map((label) => (
                <th key={label} scope="col" className="rf-p-2">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nodes.length ? (
              nodes.map((node) => renderNode(node, 0))
            ) : (
              <tr>
                <td colSpan={8} className="rf-p-4">
                  No BOM items
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="rf-p-2 rf-text-sm" aria-live="polite">
        Known line-item cost: {costLabel(nodes)}
      </div>
      <div className="rf-p-2 rf-text-xs rf-text-muted-foreground">
        Subtotals include each material line and its descendants once. Estimates
        use the supplier’s lowest quantity tier; quantity discounts, pack
        rounding, shipping and tax are not included.
      </div>
    </div>
  )
}
