import { AlertTriangleIcon, PlayIcon } from "lucide-react"
import { Button } from "lib/components/ui/button"
import type { CircuitJsonError } from "circuit-json"

/**
 * Shown when a render completed (circuitJson is present) but produced no
 * geometry the requested viewer can display. Without this the viewer would
 * mount with nothing to draw and show a blank/black canvas that never renders,
 * leaving the user with no indication of what went wrong.
 */
export const EmptyGeometryState = ({
  viewerLabel,
  warnings,
  onViewErrors,
  onRunClicked,
}: {
  viewerLabel: string
  warnings?: CircuitJsonError[] | null
  onViewErrors?: () => void
  onRunClicked?: () => void
}) => {
  return (
    <div className="rf-flex rf-flex-col rf-items-center rf-justify-center rf-h-full rf-min-h-[300px] rf-bg-gray-50 rf-text-gray-600 rf-p-6 rf-text-center">
      <AlertTriangleIcon className="rf-size-12 rf-mb-4 rf-text-amber-500" />
      <p className="rf-text-md rf-font-semibold rf-text-gray-800 rf-mb-1">
        Nothing to show in the {viewerLabel} view
      </p>
      <p className="rf-text-sm rf-max-w-md rf-mb-4">
        The circuit finished rendering but did not produce any {viewerLabel}{" "}
        geometry. This usually means the code ran without a fatal error but did
        not add any components, or the components failed to produce a footprint.
      </p>
      {warnings && warnings.length > 0 && (
        <div className="rf-w-full rf-max-w-md rf-mb-4 rf-text-left rf-bg-amber-50 rf-border rf-border-amber-200 rf-rounded-md rf-p-3">
          <p className="rf-text-xs rf-font-semibold rf-text-amber-800 rf-mb-1">
            {warnings.length} warning{warnings.length > 1 ? "s" : ""} during
            render:
          </p>
          <ul className="rf-list-disc rf-list-inside rf-space-y-1">
            {warnings.slice(0, 5).map((warning, i) => (
              <li
                key={i}
                className="rf-text-xs rf-font-mono rf-text-amber-700 rf-break-words"
              >
                {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="rf-flex rf-items-center rf-gap-2">
        {onViewErrors && (
          <Button variant="outline" onClick={onViewErrors}>
            View errors &amp; warnings
          </Button>
        )}
        {onRunClicked && (
          <Button
            className="rf-bg-blue-600 rf-hover:bg-blue-500"
            onClick={onRunClicked}
          >
            Run again
            <PlayIcon className="rf-w-3 rf-h-3 rf-ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default EmptyGeometryState
