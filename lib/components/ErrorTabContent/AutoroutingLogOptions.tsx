import { CircuitBoardIcon, DownloadIcon, UploadIcon } from "lucide-react"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "lib/components/ui/dropdown-menu"

export const AutoroutingLogOptions = ({
  autoroutingLog,
  onReportAutoroutingLog,
}: {
  autoroutingLog?: Record<string, { simpleRouteJson: any }>
  onReportAutoroutingLog?: (key: string, data: any) => void
}) => (
  <>
    {Object.keys(autoroutingLog ?? {}).length > 0 && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <CircuitBoardIcon className="rf-w-4 rf-h-4 rf-mr-2" />
            Open Autorouting Log
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="rf-w-96">
          {Object.entries(autoroutingLog ?? {}).map(
            ([key, { simpleRouteJson }]) => (
              <DropdownMenuItem
                key={key}
                className="rf-flex rf-justify-between rf-items-center"
              >
                <span className="rf-truncate rf-text-xs rf-mr-2">{key}</span>
                <div className="rf-flex rf-gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      const blob = new Blob(
                        [JSON.stringify(simpleRouteJson, null, 2)],
                        { type: "application/json" },
                      )
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = `${key}-autorouting.json`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                  >
                    <DownloadIcon className="rf-w-3 rf-h-3" />
                    Download
                  </Button>
                  {onReportAutoroutingLog && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onReportAutoroutingLog) {
                          onReportAutoroutingLog(key, { simpleRouteJson })
                        }
                      }}
                    >
                      <UploadIcon className="rf-w-3 rf-h-3" />
                      Report Bug
                    </Button>
                  )}
                </div>
              </DropdownMenuItem>
            ),
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )}
  </>
)
