import { PCBViewer } from "@tscircuit/pcb-viewer"
import type { AnyCircuitElement } from "circuit-json"
import { AlertCircle, Loader2 } from "lucide-react"
import type { ComponentProps } from "react"

type PCBViewerProps = ComponentProps<typeof PCBViewer>

interface FootprintPreviewPanelProps {
  circuitJson: AnyCircuitElement[] | null
  error: string | null
  isLoading: boolean
  height: number
}

export const FootprintPreviewPanel = ({
  circuitJson,
  error,
  isLoading,
  height,
}: FootprintPreviewPanelProps) => {
  return (
    <section
      className="rf-flex rf-min-w-0 rf-items-center rf-justify-center"
      style={{ height }}
    >
      {isLoading ? (
        <div
          className="rf-flex rf-w-full rf-items-center rf-justify-center rf-gap-2 rf-bg-zinc-950 rf-text-sm rf-text-zinc-300"
          style={{ height }}
        >
          <Loader2 className="rf-h-4 rf-w-4 rf-animate-spin" />
          Loading preview...
        </div>
      ) : error ? (
        <div
          className="rf-flex rf-w-full rf-items-center rf-justify-center rf-bg-zinc-950 rf-p-4"
          style={{ height }}
        >
          <div className="rf-flex rf-max-w-[320px] rf-items-start rf-gap-2 rf-text-sm rf-text-zinc-300">
            <AlertCircle className="rf-mt-0.5 rf-h-4 rf-w-4 rf-flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      ) : circuitJson ? (
        <div className="rf-w-full rf-min-w-0 rf-overflow-hidden">
          <PCBViewer
            circuitJson={circuitJson as PCBViewerProps["circuitJson"]}
            height={height}
            allowEditing={false}
            clickToInteractEnabled={false}
            focusOnHover={false}
            disablePcbGroups
          />
        </div>
      ) : (
        <div
          className="rf-flex rf-w-full rf-items-center rf-justify-center rf-bg-zinc-950 rf-text-sm rf-text-zinc-300"
          style={{ height }}
        >
          No preview
        </div>
      )}
    </section>
  )
}
