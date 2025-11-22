import { useEffect, useState } from "react"
import type { CircuitJson } from "circuit-json"
import { generateLightBurnSvg } from "lbrnts"
import { convertCircuitJsonToLbrn } from "circuit-json-to-lbrn"
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
  circuitJson?: CircuitJson | null
}

export function LbrnExportOptionsDialog({
  open,
  onOpenChange,
  onExport,
  circuitJson,
}: LbrnExportOptionsDialogProps) {
  const [includeSilkscreen, setIncludeSilkscreen] = useState(false)
  const [previewSvg, setPreviewSvg] = useState<string | null>(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !circuitJson) {
      setPreviewSvg(null)
      setPreviewError(null)
      return
    }

    setIsGeneratingPreview(true)
    try {
      const project = convertCircuitJsonToLbrn(circuitJson, {
        includeSilkscreen,
      })
      const svg = generateLightBurnSvg(project)
      setPreviewSvg(svg)
      setPreviewError(null)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error generating preview"
      setPreviewSvg(null)
      setPreviewError(errorMessage)
    } finally {
      setIsGeneratingPreview(false)
    }
  }, [circuitJson, includeSilkscreen, open])

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

          <div className="rf-space-y-2">
            <p className="rf-text-xs rf-font-semibold">Preview</p>
            <div className="rf-rounded-md rf-border rf-bg-muted/50 rf-p-3 rf-text-xs">
              {!circuitJson && (
                <p className="rf-text-muted-foreground">
                  Load a circuit to generate a preview.
                </p>
              )}

              {circuitJson && isGeneratingPreview && (
                <p className="rf-text-muted-foreground">
                  Generating preview...
                </p>
              )}

              {previewError && (
                <p className="rf-text-destructive">{previewError}</p>
              )}

              {previewSvg && !isGeneratingPreview && !previewError && (
                <div
                  className="rf-flex rf-items-center rf-justify-center rf-overflow-hidden rf-rounded rf-bg-white rf-p-2"
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                />
              )}
            </div>
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
