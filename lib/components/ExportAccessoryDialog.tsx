import type { CircuitJson } from "circuit-json"
import { Download, LoaderCircle, PackageOpen } from "lucide-react"
import { useEffect, useState } from "react"
import { useStyles } from "lib/hooks/use-styles"
import {
  downloadFdmComponentBox,
  generateFdmComponentBox,
  type GeneratedFdmComponentBox,
} from "lib/optional-features/exporting/formats/export-fdm-component-box"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

const COMPONENT_BOX = "Component Box (3MF)" as const
type AccessoryName = typeof COMPONENT_BOX

export interface ExportAccessoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  circuitJson: CircuitJson
  projectName: string
}

const formatMillimetres = (value: number) => `${value.toFixed(1)} mm`

export function ExportAccessoryDialog({
  open,
  onOpenChange,
  circuitJson,
  projectName,
}: ExportAccessoryDialogProps) {
  useStyles()

  const [selectedAccessory, setSelectedAccessory] = useState<
    AccessoryName | ""
  >("")
  const [generatedBox, setGeneratedBox] =
    useState<GeneratedFdmComponentBox | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    if (!open || selectedAccessory !== COMPONENT_BOX) return

    let cancelled = false
    setIsGenerating(true)
    setGeneratedBox(null)
    setError(null)

    generateFdmComponentBox(circuitJson)
      .then((result) => {
        if (cancelled) return
        const pngBytes = Uint8Array.from(result.previewPng)
        setGeneratedBox(result)
        setPreviewUrl(
          URL.createObjectURL(
            new Blob([pngBytes.buffer], { type: "image/png" }),
          ),
        )
      })
      .catch((generationError) => {
        if (cancelled) return
        setError(
          generationError instanceof Error
            ? generationError.message
            : String(generationError),
        )
      })
      .finally(() => {
        if (!cancelled) setIsGenerating(false)
      })

    return () => {
      cancelled = true
    }
  }, [circuitJson, open, selectedAccessory])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedAccessory("")
      setGeneratedBox(null)
      setPreviewUrl(null)
      setError(null)
      setIsGenerating(false)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rf-max-h-[90vh] rf-max-w-3xl rf-overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Accessory</DialogTitle>
          <DialogDescription>
            Generate a printable accessory from the components in this circuit.
          </DialogDescription>
        </DialogHeader>

        <div className="rf-grid rf-gap-5 md:rf-grid-cols-[220px_1fr]">
          <div className="rf-space-y-2">
            <label
              htmlFor="accessory-select"
              className="rf-text-sm rf-font-medium"
            >
              Accessory
            </label>
            <Select
              value={selectedAccessory}
              onValueChange={(value) =>
                setSelectedAccessory(value as AccessoryName)
              }
            >
              <SelectTrigger id="accessory-select">
                <SelectValue placeholder="Choose an accessory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={COMPONENT_BOX}>Component Box</SelectItem>
              </SelectContent>
            </Select>
            <p className="rf-text-xs rf-leading-relaxed rf-text-zinc-500">
              Creates grouped compartments with raised refdes labels as a
              multi-material 3MF.
            </p>
          </div>

          <div className="rf-overflow-hidden rf-rounded-lg rf-border rf-border-zinc-200 rf-bg-zinc-50 dark:rf-border-zinc-800 dark:rf-bg-zinc-900">
            <div className="rf-flex rf-min-h-56 rf-items-center rf-justify-center">
              {!selectedAccessory && (
                <div className="rf-flex rf-flex-col rf-items-center rf-gap-3 rf-p-8 rf-text-center rf-text-zinc-500">
                  <PackageOpen className="rf-h-10 rf-w-10 rf-stroke-1" />
                  <p className="rf-text-sm">
                    Choose an accessory to generate its preview.
                  </p>
                </div>
              )}
              {isGenerating && (
                <div className="rf-flex rf-flex-col rf-items-center rf-gap-3 rf-p-8 rf-text-zinc-600 dark:rf-text-zinc-300">
                  <LoaderCircle className="rf-h-8 rf-w-8 rf-animate-spin" />
                  <p className="rf-text-sm">Generating component box…</p>
                </div>
              )}
              {error && !isGenerating && (
                <div className="rf-p-8 rf-text-center">
                  <p className="rf-text-sm rf-font-medium rf-text-red-600">
                    Could not generate the preview
                  </p>
                  <p className="rf-mt-1 rf-text-xs rf-text-red-500">{error}</p>
                </div>
              )}
              {previewUrl && generatedBox && !isGenerating && (
                <img
                  src={previewUrl}
                  alt="Generated component box preview"
                  className="rf-block rf-h-auto rf-max-h-[300px] rf-w-full rf-object-contain"
                />
              )}
            </div>
            {generatedBox && !isGenerating && (
              <div className="rf-flex rf-flex-wrap rf-gap-x-5 rf-gap-y-1 rf-border-t rf-border-zinc-200 rf-bg-white rf-px-4 rf-py-3 rf-text-xs rf-text-zinc-600 dark:rf-border-zinc-800 dark:rf-bg-zinc-950 dark:rf-text-zinc-300">
                <span>{generatedBox.compartments.length} compartments</span>
                <span>
                  {formatMillimetres(generatedBox.dimensions.width)} ×{" "}
                  {formatMillimetres(generatedBox.dimensions.depth)} ×{" "}
                  {formatMillimetres(generatedBox.dimensions.height)}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!generatedBox || isGenerating}
            onClick={() => {
              if (!generatedBox) return
              downloadFdmComponentBox({ generatedBox, projectName })
            }}
          >
            <Download />
            Download 3MF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
