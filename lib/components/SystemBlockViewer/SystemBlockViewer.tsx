import { useMemo, useState } from "react"
import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"
import { Button } from "../ui/button"

/** Render the resolved geometry in Circuit JSON without running layout again. */
export function SystemBlockViewer({
  circuitJson,
}: { circuitJson: CircuitJson }) {
  const pages = circuitJson.filter(
    (record) => record.type === "system_block_page",
  )
  const [selectedPageId, setSelectedPageId] = useState<string>()
  const page =
    pages.find((page) => page.system_block_page_id === selectedPageId) ??
    pages[0]
  const pageId = page?.system_block_page_id
  const imageUrl = useMemo(() => {
    if (!pageId) return undefined
    const svg = convertCircuitJsonToSystemSvg(circuitJson, {
      systemBlockPageId: pageId,
    })
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }, [circuitJson, pageId])

  if (!page || !imageUrl) {
    return (
      <div role="status" className="rf-p-8 rf-text-center rf-text-gray-500">
        No system diagrams. Add a systemblock.page to your circuit to see it
        here.
      </div>
    )
  }

  return (
    <div className="rf-flex rf-flex-col rf-h-full rf-bg-white rf-text-gray-900">
      {pages.length > 1 && (
        <label className="rf-flex rf-items-center rf-gap-2 rf-p-2 rf-text-sm">
          System page
          <select
            aria-label="System page"
            value={pageId}
            onChange={(event) => setSelectedPageId(event.target.value)}
            className="rf-border rf-rounded rf-p-1 rf-bg-white rf-text-gray-900"
          >
            {pages.map((page, index) => (
              <option
                key={page.system_block_page_id}
                value={page.system_block_page_id}
              >
                {page.display_name ?? page.name ?? `Page ${index + 1}`}
              </option>
            ))}
          </select>
        </label>
      )}
      <SystemImage
        key={pageId}
        src={imageUrl}
        name={page.display_name ?? page.name ?? "System diagram"}
      />
    </div>
  )
}

function SystemImage({ src, name }: { src: string; name: string }) {
  const [zoom, setZoom] = useState(1)
  return (
    <>
      <div className="rf-flex rf-items-center rf-gap-2 rf-p-2 rf-border-b">
        <Button
          variant="outline"
          size="sm"
          aria-label="Zoom out"
          disabled={zoom <= 0.5}
          onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
        >
          −
        </Button>
        <Button
          variant="outline"
          size="sm"
          aria-label="Zoom in"
          disabled={zoom >= 4}
          onClick={() => setZoom((value) => Math.min(4, value + 0.25))}
        >
          +
        </Button>
        <Button variant="outline" size="sm" onClick={() => setZoom(1)}>
          Fit
        </Button>
        <span className="rf-text-xs" aria-live="polite">
          {Math.round(zoom * 100)}%
        </span>
      </div>
      <div
        className="rf-flex-1 rf-min-h-0 rf-overflow-auto"
        aria-label="System diagram viewport"
        tabIndex={0}
      >
        <div style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
          <img
            src={src}
            alt={name}
            draggable={false}
            className="rf-w-full rf-h-full rf-object-contain"
          />
        </div>
      </div>
    </>
  )
}
