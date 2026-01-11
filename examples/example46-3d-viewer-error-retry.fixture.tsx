import React, { useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { ErrorFallback } from "lib/components/ErrorFallback"
import { CircuitJsonPreview } from "lib/components/CircuitJsonPreview/CircuitJsonPreview"

const ErrorThrowingCadViewer = () => {
  throw new Error("Error creating WebGL context.")
}

export default () => {
  const [simulateError, setSimulateError] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  const circuitJson = [
    {
      type: "source_component",
      source_component_id: "r1",
      name: "R1",
      ftype: "simple_resistor",
      resistance: "10k",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_r1",
      source_component_id: "r1",
      center: { x: 0, y: 0 },
      layer: "top",
      rotation: 0,
      width: 3,
      height: 1.5,
    },
  ]

  return (
    <div className="rf-p-4">
      <div className="rf-mb-4 rf-flex rf-gap-2 rf-items-center">
        <button
          onClick={() => setSimulateError(true)}
          className="rf-px-4 rf-py-2 rf-bg-red-100 rf-rounded"
        >
          Simulate Error
        </button>
        <button
          onClick={() => setSimulateError(false)}
          className="rf-px-4 rf-py-2 rf-bg-green-100 rf-rounded"
        >
          Clear Error
        </button>
        <span className="rf-text-sm rf-text-gray-600">
          Retries: {retryCount}
        </span>
      </div>

      <div className="rf-h-[600px]">
        <ErrorBoundary
          resetKeys={[simulateError]}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <ErrorFallback
              error={error}
              resetErrorBoundary={() => {
                setRetryCount((c) => c + 1)
                setSimulateError(false)
                resetErrorBoundary()
              }}
            />
          )}
        >
          {simulateError ? (
            <ErrorThrowingCadViewer />
          ) : (
            <CircuitJsonPreview
              circuitJson={circuitJson as any}
              defaultActiveTab="cad"
            />
          )}
        </ErrorBoundary>
      </div>
    </div>
  )
}
