import { useEffect, useState } from "react"
import type { CircuitJson } from "circuit-json"
import type { DrawingPageOutput } from "@tscircuit/circuit-json-to-drawing"
import { renderDrawingPages } from "./render-drawing-pages"

export const EngineeringDrawingViewer = ({
  circuitJson,
}: {
  circuitJson: CircuitJson
}) => {
  const [result, setResult] = useState<{
    input: CircuitJson
    pages?: DrawingPageOutput[]
    error?: string
  } | null>(null)
  const [selectedPageId, setSelectedPageId] = useState("")
  const hasPages = circuitJson.some(
    (element) => element.type === "drawing_page",
  )

  useEffect(() => {
    if (!hasPages) return
    let cancelled = false
    setResult(null)
    void renderDrawingPages(circuitJson).then(
      (pages) => {
        if (!cancelled) setResult({ input: circuitJson, pages })
      },
      (error: unknown) => {
        if (!cancelled) {
          setResult({
            input: circuitJson,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [circuitJson, hasPages])

  if (!hasPages) {
    return (
      <div role="status" className="rf-p-6 rf-text-sm rf-text-gray-500">
        No engineering drawings in this circuit.
      </div>
    )
  }
  const current = result?.input === circuitJson ? result : null
  if (current?.error !== undefined) throw new Error(current.error)
  if (!current?.pages) {
    return (
      <div role="status" className="rf-p-6 rf-text-sm rf-text-gray-500">
        Rendering engineering drawings…
      </div>
    )
  }
  const pages = current.pages
  const page =
    pages.find((item) => item.drawingPageId === selectedPageId) ?? pages[0]
  if (!page) return null
  const pageName = (id: string) => {
    const record = circuitJson.find(
      (element) =>
        element.type === "drawing_page" && element.drawing_page_id === id,
    )
    return record?.type === "drawing_page" ? (record.name ?? id) : id
  }

  return (
    <div className="rf-flex rf-h-full rf-flex-col rf-bg-gray-100">
      {pages.length > 1 && (
        <div className="rf-border-b rf-bg-white rf-p-2">
          <select
            aria-label="Drawing page"
            className="rf-max-w-full rf-rounded rf-border rf-p-1 rf-text-sm"
            value={page.drawingPageId}
            onChange={(event) => setSelectedPageId(event.target.value)}
          >
            {pages.map((item) => (
              <option key={item.drawingPageId} value={item.drawingPageId}>
                {pageName(item.drawingPageId)}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="rf-flex-1 rf-min-h-0 rf-overflow-auto rf-p-4">
        <img
          alt={`Engineering drawing: ${pageName(page.drawingPageId)}`}
          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(page.svg)}`}
          className="rf-block rf-w-full rf-h-auto rf-bg-white rf-shadow"
        />
      </div>
    </div>
  )
}
