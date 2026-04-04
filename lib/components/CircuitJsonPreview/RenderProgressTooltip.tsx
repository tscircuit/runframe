import { Circle, LoaderCircleIcon } from "lucide-react"
import { useEffect, useState } from "react"
import type { RenderLog } from "lib/render-logging/RenderLog"
import type { ActiveAsyncEffect } from "./PreviewContentProps"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"

interface RenderProgressTooltipProps {
  renderLog: RenderLog
  activeEffectName?: string
  activeAsyncEffects?: ActiveAsyncEffect[]
  isRunningCode?: boolean
}

const formatDuration = (durationMs: number) => {
  if (durationMs >= 60_000) return `${(durationMs / 60_000).toFixed(1)}m`
  if (durationMs >= 1_000) return `${(durationMs / 1_000).toFixed(1)}s`
  return `${durationMs}ms`
}

export const RenderProgressTooltip = ({
  renderLog,
  activeEffectName,
  activeAsyncEffects,
  isRunningCode,
}: RenderProgressTooltipProps) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!isRunningCode) return
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 250)
    return () => clearInterval(interval)
  }, [isRunningCode])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="rf-flex rf-items-center rf-gap-2 rf-min-w-0 rf-max-w-xs">
            {activeEffectName ? (
              <div
                className="rf-text-xs rf-text-gray-500 rf-truncate rf-min-w-0"
                title={activeEffectName}
              >
                {activeEffectName}
              </div>
            ) : (
              renderLog.lastRenderEvent && (
                <div
                  className="rf-text-xs rf-text-gray-500 rf-truncate rf-min-w-0"
                  title={renderLog.lastRenderEvent?.phase ?? ""}
                >
                  {renderLog.lastRenderEvent?.phase ?? ""}
                </div>
              )
            )}
            <div className="rf-w-4 rf-h-4 rf-bg-blue-500 rf-opacity-50 rf-rounded-full rf-text-white rf-flex-shrink-0">
              <LoaderCircleIcon className="rf-w-4 rf-h-4 rf-animate-spin" />
            </div>
            <div className="rf-text-xs rf-font-bold rf-text-gray-700 rf-tabular-nums rf-flex-shrink-0">
              {((renderLog.progress ?? 0) * 100).toFixed(1)}%
            </div>
          </div>
        </TooltipTrigger>
        {!!activeAsyncEffects?.length && (
          <TooltipContent side="bottom" className="rf-max-w-sm">
            <div className="rf-text-xs rf-font-semibold rf-mb-1">
              Running async effects
            </div>
            <ul className="rf-space-y-1">
              {activeAsyncEffects
                .slice()
                .sort((a, b) => a.startTime - b.startTime)
                .map((effect) => (
                  <li
                    key={`${effect.phase}|${effect.componentDisplayName ?? ""}|${effect.effectName}`}
                    className="rf-flex rf-items-start rf-gap-2"
                  >
                    <Circle className="rf-w-2 rf-h-2 rf-mt-1 rf-fill-current rf-stroke-none" />
                    <div className="rf-min-w-0">
                      <div className="rf-font-medium rf-break-all">
                        {effect.effectName}
                      </div>
                      <div className="rf-text-[11px] rf-text-muted-foreground rf-break-all">
                        {effect.phase}
                        {effect.componentDisplayName
                          ? ` · ${effect.componentDisplayName}`
                          : ""}
                        {` · ${formatDuration(now - effect.startTime)}`}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}
