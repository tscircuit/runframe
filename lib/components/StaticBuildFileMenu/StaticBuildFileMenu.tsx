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

/**
 * A reusable file menu component for static build viewers.
 * 
 * This component provides a standardized "File" menu with export functionality
 * and customizable actions for static circuit JSON viewers. It follows the
 * established patterns in the runframe codebase.
 * 
 * @example
 * ```tsx
 * <StaticBuildFileMenu
 *   circuitJson={currentCircuitJson}
 *   currentFile={selectedFile}
 *   onExport={(format, filename) => console.log(`Exporting ${filename} as ${format}`)}
 *   showExport={true}
 * />
 * ```
 */
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

    // Generate filename based on current file and format
    const baseFilename = currentFile.replace(/\.[^/.]+$/, "") // Remove extension
    const exportFilename = `${baseFilename}.${format}`

    if (onExport) {
      onExport(format, exportFilename)
    } else {
      // Default export behavior
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
          {/* Export Section */}
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

          {/* Custom Menu Items */}
          {customMenuItems && (
            <>
              {customMenuItems}
              <DropdownMenuSeparator />
            </>
          )}

          {/* File Info */}
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
