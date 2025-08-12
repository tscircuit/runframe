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

export const RunFrameFileMenu = () => {
  const circuitJson = useRunFrameStore((s) => s.circuitJson)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="rf-whitespace-nowrap rf-text-xs font-medium rf-p-2 rf-mx-1 rf-cursor-pointer rf-relative">
          File
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
