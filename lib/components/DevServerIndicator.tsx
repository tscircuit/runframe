import {
  type DevServerConnectionStatus,
  useDevServerConnectionStatus,
} from "lib/hooks/use-dev-server-connection"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"

export const DevServerIndicator = (props: {
  status?: DevServerConnectionStatus
}) => {
  const detectedStatus = useDevServerConnectionStatus()
  const status = props.status ?? detectedStatus

  if (status === "hidden") return null

  const isConnected = status === "connected"

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="rf-inline-flex rf-items-center rf-gap-1.5 rf-rounded-full rf-border rf-border-slate-200 rf-bg-white/90 rf-px-2 rf-py-1 rf-text-[11px] rf-font-medium rf-leading-none rf-select-none rf-flex-shrink-0"
            aria-live="polite"
            aria-label={
              isConnected
                ? "Connected to tsci dev server"
                : "Disconnected from tsci dev server"
            }
          >
            <span aria-hidden="true">{isConnected ? "🟢" : "🔴"}</span>
            <span
              className={isConnected ? "rf-text-green-700" : "rf-text-red-700"}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isConnected
            ? "Connected to running tsci dev"
            : "tsci dev is stopped or unreachable"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
