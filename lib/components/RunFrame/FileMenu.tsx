import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu"
import {
  availableExports,
  exportAndDownload,
} from "lib/optional-features/exporting/export-and-download"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import { ChevronRight } from "lucide-react"

export const RunFrameFileMenu = () => {
  const circuitJson = useRunFrameStore((s) => s.circuitJson)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="rf-inline-flex rf-items-center rf-justify-center rf-h-9 rf-rounded-lg rf-bg-zinc-100 rf-px-3 rf-mx-1 rf-text-sm rf-font-medium rf-text-zinc-500 dark:rf-bg-zinc-800 dark:rf-text-zinc-400 rf-whitespace-nowrap rf-cursor-pointer rf-relative">
          <span>File</span>
          <ChevronRight className="rf-ml-1 rf-h-4 rf-w-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="rf-text-xs">
            Download
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {availableExports.map((exp, i) => (
                <DropdownMenuItem
                  key={i}
                  onSelect={() => {
                    if (!circuitJson) return
                    exportAndDownload({
                      exportName: exp.name,
                      circuitJson,
                      projectName: "circuit",
                    })
                  }}
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
