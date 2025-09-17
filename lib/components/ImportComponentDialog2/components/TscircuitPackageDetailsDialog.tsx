import { ExternalLink, Loader2 } from "lucide-react"
import { Button } from "../../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs"
import type {
  ComponentSearchResult,
  TscircuitPackageDetails,
} from "../types"

interface TscircuitPackageDetailsDialogProps {
  component: ComponentSearchResult | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isLoading: boolean
  details: TscircuitPackageDetails | null
  previewTab: "pcb" | "schematic"
  onPreviewTabChange: (value: "pcb" | "schematic") => void
  isSubmitting: boolean
  onImport: () => void
}

const buildPreviewUrl = (
  component: ComponentSearchResult | null,
  tab: "pcb" | "schematic",
) => {
  if (!component?.owner || !component?.name) return null
  return `https://registry-api.tscircuit.com/packages/images/${component.owner}/${component.name}/${tab}.png`
}

export const TscircuitPackageDetailsDialog = ({
  component,
  isOpen,
  onOpenChange,
  isLoading,
  details,
  previewTab,
  onPreviewTabChange,
  isSubmitting,
  onImport,
}: TscircuitPackageDetailsDialogProps) => {
  const pcbPreviewUrl = buildPreviewUrl(component, "pcb")
  const schematicPreviewUrl = buildPreviewUrl(component, "schematic")
  const packageName = component?.name?.split("/").pop()
  const ownerUrl = component?.owner
    ? `https://tscircuit.com/${component.owner}`
    : undefined
  const packageUrl =
    component?.owner && packageName
      ? `https://tscircuit.com/${component.owner}/${packageName}`
      : undefined

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showOverlay={false}
        style={{ width: "calc(100vw - 2rem)" }}
        className="rf-max-w-5xl !rf-overflow-y-auto rf-max-h-[90vh] rf-overflow-hidden rf-flex rf-flex-col rf-rounded-sm"
      >
        <DialogHeader className="rf-pb-4 rf-border-b">
          <div className="rf-flex rf-items-start rf-justify-between rf-gap-4">
            <div className="rf-flex-1 rf-min-w-0">
              <DialogTitle className="rf-text-xl rf-font-semibold rf-truncate">
                {packageName}
              </DialogTitle>
              <DialogDescription>
                {component?.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rf-flex-1 rf-overflow-y-auto rf-py-4 rf-space-y-6">
          {component?.owner ? (
            <div>
              <label className="rf-text-xs rf-font-medium rf-text-gray-500 rf-uppercase rf-tracking-wide">
                Created by
              </label>
              <div className="rf-mt-1 rf-text-sm rf-font-medium">
                {ownerUrl ? (
                  <a
                    href={ownerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rf-text-black hover:rf-underline"
                  >
                    {component.owner}
                  </a>
                ) : (
                  component.owner
                )}
              </div>
            </div>
          ) : null}

          <div>
            <h3 className="rf-text-lg rf-font-semibold rf-mb-4">Preview</h3>
            <Tabs value={previewTab} onValueChange={onPreviewTabChange}>
              <TabsList className="rf-inline-flex rf-h-9 rf-items-center rf-justify-center rf-rounded-lg rf-bg-zinc-100 rf-p-1 rf-text-zinc-500 dark:rf-bg-zinc-800 dark:rf-text-zinc-400">
                <TabsTrigger value="pcb">PCB</TabsTrigger>
                <TabsTrigger value="schematic">Schematic</TabsTrigger>
              </TabsList>

              <div className="rf-mt-4">
                <TabsContent
                  value="pcb"
                  className="rf-border rf-rounded-lg rf-overflow-hidden rf-bg-gray-50"
                >
                  {pcbPreviewUrl ? (
                    <img
                      src={pcbPreviewUrl}
                      alt={`${component?.name} PCB preview`}
                      className="rf-w-full rf-h-full rf-object-contain rf-bg-white rf-p-4"
                    />
                  ) : null}
                </TabsContent>
                <TabsContent
                  value="schematic"
                  className="rf-border rf-rounded-lg rf-overflow-hidden rf-bg-gray-50"
                >
                  {schematicPreviewUrl ? (
                    <img
                      src={schematicPreviewUrl}
                      alt={`${component?.name} schematic preview`}
                      className="rf-w-full rf-h-full rf-object-contain rf-bg-white rf-p-4"
                    />
                  ) : null}
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {details?.ai_description ? (
            <section>
              <h3 className="rf-text-lg rf-font-semibold rf-mb-3">AI Description</h3>
              <div className="rf-bg-gray-50 rf-border rf-border-gray-200 rf-rounded-lg rf-p-4">
                <p className="rf-text-sm rf-text-gray-700 rf-leading-relaxed">
                  {details.ai_description}
                </p>
              </div>
            </section>
          ) : null}

          {details?.ai_usage_instructions ? (
            <section>
              <h3 className="rf-text-lg rf-font-semibold rf-mb-3">Usage Instructions</h3>
              <div className="rf-bg-gray-50 rf-border rf-border-gray-200 rf-rounded-lg rf-p-4">
                <p className="rf-text-sm rf-text-gray-700 rf-leading-relaxed rf-whitespace-pre-wrap">
                  {details.ai_usage_instructions}
                </p>
              </div>
            </section>
          ) : null}

          {isLoading ? (
            <div className="rf-flex rf-justify-center rf-items-center rf-gap-2 rf-text-gray-500">
              <Loader2 className="rf-h-4 rf-w-4 rf-animate-spin" />
              <span className="rf-text-sm">Loading package details...</span>
            </div>
          ) : null}
        </div>

        <DialogFooter className="rf-pt-4 rf-border-t rf-flex rf-flex-col sm:rf-flex-row rf-justify-between rf-gap-2">
          <div className="rf-flex-1">
            {packageUrl ? (
              <Button
                variant="outline"
                size="sm"
                className="rf-gap-2 rf-w-full sm:rf-w-auto"
                onClick={() => window.open(packageUrl, "_blank")}
              >
                <ExternalLink className="rf-h-4 rf-w-4" />
                View on tscircuit.com
              </Button>
            ) : null}
          </div>
          <div className="rf-flex rf-flex-col sm:rf-flex-row rf-gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rf-order-2 sm:rf-order-1"
            >
              Close
            </Button>
            <Button
              onClick={onImport}
              disabled={isSubmitting}
              className="rf-bg-blue-600 hover:rf-bg-blue-700"
            >
              {isSubmitting ? (
                <Loader2 className="rf-h-4 rf-w-4 rf-animate-spin" />
              ) : (
                "Import Component"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
