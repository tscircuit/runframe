import type { RenderLog } from "lib/render-logging/RenderLog"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

/**
 * After this long without a settled circuitJson we assume the render is slow or
 * stuck and surface a stronger hint so users don't stare at a spinner forever.
 */
const SLOW_RENDER_THRESHOLD_MS = 30_000

/**
 * Shown on a canvas tab while a render is in progress but no circuitJson has
 * been produced yet. This distinguishes "rendering in progress" from the
 * "nothing has been run yet" tip card (PreviewEmptyState), so users can tell
 * that something is actually loading (and whether it may be stuck).
 */
const PreviewLoadingState = ({
  renderLog,
  activeEffectName,
}: {
  renderLog?: RenderLog | null
  activeEffectName?: string
}) => {
  const [isSlow, setIsSlow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsSlow(true), SLOW_RENDER_THRESHOLD_MS)
    return () => clearTimeout(timer)
  }, [])

  const progress = renderLog?.progress ?? 0
  const progressPercent = Math.max(0, Math.min(100, progress * 100))
  const phase = activeEffectName ?? renderLog?.lastRenderEvent?.phase ?? null

  return (
    <div className="rf-flex rf-flex-col rf-items-center rf-justify-center rf-h-full rf-bg-gray-50 rf-text-gray-500 rf-p-4">
      <Loader2 className="rf-size-10 rf-mb-4 rf-animate-spin rf-text-blue-500" />
      <p className="rf-text-md rf-font-medium rf-text-gray-700">
        {isSlow ? "Still rendering…" : "Rendering…"}
      </p>
      {phase && (
        <p
          className="rf-text-xs rf-text-gray-500 rf-mt-1 rf-max-w-xs rf-truncate"
          title={phase}
        >
          {phase}
        </p>
      )}
      <div className="rf-w-48 rf-h-1.5 rf-bg-gray-200 rf-rounded-full rf-mt-3 rf-overflow-hidden">
        <div
          className="rf-h-full rf-bg-blue-500 rf-transition-all rf-duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {isSlow && (
        <p className="rf-text-xs rf-text-gray-400 rf-mt-3 rf-max-w-xs rf-text-center">
          This is taking longer than usual. The render may be stuck — check the
          Render Log tab for details.
        </p>
      )}
    </div>
  )
}

export default PreviewLoadingState
