import React from "react"

export const ErrorFallback = ({ error }: { error: Error }) => {
  return (
    <div
      data-testid="error-container"
      className="rf-error-container rf-mt-4 rf-bg-red-50 rf-rounded-md rf-border rf-border-red-200"
    >
      <div className="rf-p-4">
        <h2 className="rf-text-lg rf-font-semibold rf-text-red-800 rf-mb-3">
          Error Loading 3D Viewer
        </h2>
        <p className="rf-text-xs rf-font-mono rf-whitespace-pre-wrap rf-text-red-700">
          {error.message}
        </p>
        <details
          style={{ whiteSpace: "pre-wrap" }}
          className="rf-text-xs rf-font-mono rf-text-red-600 rf-mt-2"
        >
          {error.stack}
        </details>
      </div>
    </div>
  )
}
