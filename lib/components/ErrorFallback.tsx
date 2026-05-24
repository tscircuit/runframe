import React from "react"
import { Button } from "./ui/button"

interface ErrorFallbackProps {
  error: unknown
  resetErrorBoundary?: () => void
}

export const ErrorFallback = ({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) => {
  const resolvedError =
    error instanceof Error ? error : new Error(String(error))

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
          {resolvedError.message}
        </p>
        <details
          style={{ whiteSpace: "pre-wrap" }}
          className="rf-text-xs rf-font-mono rf-text-red-600 rf-mt-2"
        >
          {resolvedError.stack}
        </details>
        {resetErrorBoundary && (
          <div className="rf-mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={resetErrorBoundary}
              className="rf-text-red-700 rf-border-red-300 hover:rf-bg-red-100"
            >
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
