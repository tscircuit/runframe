import { CadViewer } from "@tscircuit/3d-viewer"
import type { CircuitJson } from "circuit-json"
import type { ComponentProps, ReactNode } from "react"
import { useEffect, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { ErrorFallback } from "../ErrorFallback"
import { TabsContent } from "../ui/tabs"

/**
 * Mount the 3D view on first selection and retain it when another view is
 * selected: building the scene again takes seconds. While another view is
 * selected it keeps the circuit it last drew, so it does not rebuild unseen.
 */
export function CadTabContent({
  active,
  circuitJson,
  className,
  emptyState,
  isFullScreen,
  cadViewerRef,
  ...cadViewerProps
}: {
  active: boolean
  circuitJson: CircuitJson | null
  className?: string
  emptyState: ReactNode
  isFullScreen: boolean
  cadViewerRef: ComponentProps<typeof CadViewer>["ref"]
} & Pick<
  ComponentProps<typeof CadViewer>,
  "autoRotateDisabled" | "onViewSchematicComponent"
>) {
  const [visited, setVisited] = useState(active)
  useEffect(() => {
    if (active) setVisited(true)
  }, [active])

  const [drawnCircuitJson, setDrawnCircuitJson] = useState(circuitJson)
  if (active && drawnCircuitJson !== circuitJson) {
    setDrawnCircuitJson(circuitJson)
  }
  const shownCircuitJson = active ? circuitJson : drawnCircuitJson

  return (
    <TabsContent
      value="cad"
      forceMount
      className="rf-min-h-0"
      style={active ? undefined : { display: "none" }}
    >
      {(visited || active) && (
        <div className={className}>
          <ErrorBoundary
            fallbackRender={({ error, resetErrorBoundary }) => (
              <ErrorFallback
                error={error}
                resetErrorBoundary={resetErrorBoundary}
              />
            )}
          >
            {shownCircuitJson ? (
              <CadViewer
                key={`cad-${isFullScreen}`}
                ref={cadViewerRef}
                circuitJson={shownCircuitJson}
                {...cadViewerProps}
              />
            ) : (
              emptyState
            )}
          </ErrorBoundary>
        </div>
      )}
    </TabsContent>
  )
}
