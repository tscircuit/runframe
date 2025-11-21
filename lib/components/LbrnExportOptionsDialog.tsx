import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"

export interface LbrnExportOptions {
  includeSilkscreen: boolean
}

interface LbrnExportOptionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (options: LbrnExportOptions) => void
}

export function LbrnExportOptionsDialog({
  open,
  onOpenChange,
  onExport,
}: LbrnExportOptionsDialogProps) {
  const [includeSilkscreen, setIncludeSilkscreen] = useState(false)

  const handleExport = () => {
    onExport({ includeSilkscreen })
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>LightBurn Export Options</DialogTitle>
          <DialogDescription>
            Configure export settings for PCB laser ablation with LightBurn
          </DialogDescription>
        </DialogHeader>

        <div className="rf-flex rf-flex-col rf-gap-4 rf-py-4">
          <div className="rf-flex rf-items-center rf-space-x-2">
            <Checkbox
              id="includeSilkscreen"
              checked={includeSilkscreen}
              onCheckedChange={(checked) =>
                setIncludeSilkscreen(checked === true)
              }
            />
            <label
              htmlFor="includeSilkscreen"
              className="rf-text-xs rf-font-medium rf-leading-none peer-disabled:rf-cursor-not-allowed peer-disabled:rf-opacity-70"
            >
              Include silkscreen layer
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleExport}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
