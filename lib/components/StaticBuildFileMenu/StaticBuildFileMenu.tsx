import { Download, FileText, Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu"
import { Button } from "../ui/button"
import { cn } from "lib/utils"
import {
  availableExports,
  exportAndDownload,
} from "lib/optional-features/exporting/export-and-download"
import type { StaticBuildFileMenuProps } from "./StaticBuildFileMenuProps"

export const StaticBuildFileMenu = (props: StaticBuildFileMenuProps) => {
  const {
    circuitJson,
    currentFile,
    disabled = false,
    customMenuItems,
    onExport,
    onCustomAction,
    exportFormats = availableExports,
    showExport = true,
    className
  } = props

  const handleExport = (format: string) => {
    if (!circuitJson || !currentFile) return

    const baseFilename = currentFile.replace(/\.[^/.]+$/, "")
    const exportFilename = `${baseFilename}.${format}`

    if (onExport) {
      onExport(format, exportFilename)
    } else {
      exportAndDownload({
        circuitJson,
        exportFormat: format as any,
        filename: exportFilename,
      })
    }
  }

  const handleCustomAction = (action: string) => {
    onCustomAction?.(action)
  }

  return (
    <div className={cn("flex items-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="h-8 px-2 text-sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            File
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {showExport && circuitJson && (
            <>
              <div className="px-2 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Export
              </div>
              {exportFormats.map((format) => (
                <DropdownMenuItem
                  key={format}
                  onClick={() => handleExport(format)}
                  disabled={!circuitJson}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export as {format.toUpperCase()}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {customMenuItems && (
            <>
              {customMenuItems}
              <DropdownMenuSeparator />
            </>
          )}

          {currentFile && (
            <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">
              Current: {currentFile}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
