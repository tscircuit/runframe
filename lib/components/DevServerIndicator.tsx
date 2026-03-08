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
          <output
            aria-live="polite"
            aria-label={
              isConnected
                ? "Connected to tsci dev server"
                : "Disconnected from tsci dev server"
            }
            className="rf-mr-3 rf-ml-3 rf-flex-shrink-0"
          >
            <span
              aria-hidden="true"
              className={`${isConnected ? "rf-bg-green-600" : "rf-bg-red-600"} rf-inline-block rf-w-3 rf-h-3 rf-rounded-full`}
            />
          </output>
        </TooltipTrigger>
        <TooltipContent>
          {isConnected ? "connected" : "tsci dev is stopped or unreachable"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
