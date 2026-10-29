import { ChevronDown, LoaderCircleIcon } from "lucide-react"
import type { RenderLog } from "lib/render-logging/RenderLog"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

export interface ActiveAsyncEffect {
  effectName: string
  phase: string
  componentDisplayName?: string
  startTime: number
}

export const RenderStatus = ({
  renderLog,
  activeEffectName,
  activeAsyncEffects = [],
}: {
  renderLog: RenderLog
  activeEffectName?: string
  activeAsyncEffects?: ActiveAsyncEffect[]
}) => {
  const effects = [...activeAsyncEffects].sort(
    (a, b) => a.startTime - b.startTime,
  )
  const phase = renderLog.lastRenderEvent?.phase
  const summary =
    effects[0]?.effectName ?? activeEffectName ?? phase ?? "Rendering"
  const progress = `${((renderLog.progress ?? 0) * 100).toFixed(1)}%`

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Show render status details"
          title={summary}
          className="rf-flex rf-w-72 rf-max-w-full rf-shrink-0 rf-items-center rf-gap-2 rf-rounded rf-p-2 rf-text-xs hover:rf-bg-gray-100 focus-visible:rf-outline focus-visible:rf-outline-2 focus-visible:rf-outline-blue-500"
        >
          <span className="rf-min-w-0 rf-flex-1 rf-truncate rf-text-left rf-text-gray-700">
            {summary}
          </span>
          <LoaderCircleIcon className="rf-w-4 rf-h-4 rf-shrink-0 rf-animate-spin rf-text-blue-500" />
          <span className="rf-shrink-0 rf-font-bold rf-tabular-nums rf-text-gray-700">
            {progress}
          </span>
          <ChevronDown className="rf-w-4 rf-h-4 rf-shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        aria-label="Render status details"
        className="rf-w-[32rem] rf-max-w-[calc(100vw-2rem)] rf-overflow-y-auto rf-text-sm"
        style={{
          maxHeight: "min(70vh, var(--radix-popover-content-available-height))",
        }}
      >
        <h2 className="rf-font-semibold rf-mb-3">Render status · {progress}</h2>
        <div className="rf-text-xs rf-font-semibold rf-text-gray-500">
          Current phase
        </div>
        <div className="rf-mt-1 rf-whitespace-pre-wrap rf-break-words">
          {phase ?? "Waiting for render phase"}
        </div>
        <h3 className="rf-mt-4 rf-mb-2 rf-font-semibold">
          Active async effects ({effects.length})
        </h3>
        {effects.length ? (
          <ul className="rf-space-y-2">
            {effects.map((effect, index) => (
              <li
                key={`${effect.phase}|${effect.componentDisplayName ?? ""}|${effect.effectName}|${index}`}
                className="rf-rounded rf-border rf-p-3 rf-whitespace-pre-wrap rf-break-words"
              >
                <div className="rf-font-medium">{effect.effectName}</div>
                <div className="rf-mt-1 rf-text-xs rf-text-gray-600">
                  Phase: {effect.phase}
                </div>
                {effect.componentDisplayName && (
                  <div className="rf-mt-1 rf-text-xs rf-text-gray-600">
                    Component: {effect.componentDisplayName}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rf-text-gray-600">
            {activeEffectName ?? "No active async effects."}
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
