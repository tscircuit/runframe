import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuPortal,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "../ui/dropdown-menu"
import {
  availableExports,
  exportAndDownload,
} from "lib/optional-features/exporting/export-and-download"
import { toast } from "lib/utils/toast"
import type { CircuitJson } from "circuit-json"

export interface StaticBuildFileMenuProps {
  circuitJson: CircuitJson | null
  projectName: string
  isWebEmbedded?: boolean
}

export const StaticBuildFileMenu = ({
  circuitJson,
  projectName,
  isWebEmbedded = false,
}: StaticBuildFileMenuProps) => {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (exportName: string) => {
    if (!circuitJson) {
      toast.error("No Circuit JSON to export")
      return
    }

    setIsExporting(true)
    try {
      await exportAndDownload({
        exportName: exportName as any,
        circuitJson,
        projectName,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Export failed")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="rf-whitespace-nowrap rf-text-xs font-medium rf-p-2 rf-mx-1 rf-cursor-pointer rf-relative">
          File
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {/* Export - always available */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            className="rf-text-xs"
            disabled={isExporting}
          >
            {isExporting ? "Exporting..." : "Export"}
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {availableExports.map((exp, i) => (
                <DropdownMenuItem
                  key={i}
                  onSelect={() => handleExport(exp.name)}
                  disabled={isExporting || !circuitJson}
                >
                  <span className="rf-text-xs">{exp.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
