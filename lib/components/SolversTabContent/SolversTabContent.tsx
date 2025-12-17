import { useState, useMemo } from "react"
import { Box } from "lucide-react"
import type { SolverStartedEvent } from "../CircuitJsonPreview/PreviewContentProps"
import { SOLVERS } from "@tscircuit/core"
import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { ErrorBoundary } from "react-error-boundary"

interface SolversTabContentProps {
  solverEvents?: SolverStartedEvent[]
}

export const SolversTabContent = ({
  solverEvents = [],
}: SolversTabContentProps) => {
  const [selectedSolverId, setSelectedSolverId] = useState<string | null>(null)

  const solversById = useMemo(() => {
    const map = new Map<string, SolverStartedEvent>()
    for (const event of solverEvents) {
      const id = `${event.componentName}-${event.solverName}`
      map.set(id, event)
    }
    return map
  }, [solverEvents])

  const solverIds = useMemo(() => Array.from(solversById.keys()), [solversById])

  const selectedSolverEvent = selectedSolverId
    ? solversById.get(selectedSolverId)
    : null

  // Reconstruct the solver instance from the event
  const selectedSolverInstance = useMemo(() => {
    if (!selectedSolverEvent) return null

    const SolverClass = (SOLVERS as Record<string, any>)[
      selectedSolverEvent.solverName
    ]
    if (!SolverClass) {
      console.warn(
        `Solver class not found for: ${selectedSolverEvent.solverName}`,
      )
      return null
    }

    try {
      return new SolverClass(selectedSolverEvent.solverParams)
    } catch (e) {
      console.error("Failed to reconstruct solver:", e)
      return null
    }
  }, [selectedSolverEvent])

  if (solverEvents.length === 0) {
    return (
      <div className="rf-p-4">
        <div className="rf-bg-gray-50 rf-rounded-md rf-border rf-border-gray-200">
          <div className="rf-p-4">
            <h3 className="rf-text-lg rf-font-semibold rf-text-gray-800 rf-mb-3">
              No Solvers Detected
            </h3>
            <p className="rf-text-sm rf-text-gray-600">
              Solvers will appear here when the circuit runs. Solvers are used
              for tasks like component packing and autorouting.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rf-flex rf-h-full rf-overflow-hidden">
      {/* Solver List Sidebar */}
      <div className="rf-w-64 rf-border-r rf-border-gray-200 rf-overflow-y-auto rf-flex-shrink-0">
        <div className="rf-text-xs rf-font-semibold rf-text-gray-500 rf-px-3 rf-py-2 rf-bg-gray-50 rf-border-b rf-border-gray-200">
          {solverIds.length} {solverIds.length === 1 ? "Solver" : "Solvers"}
        </div>
        {solverIds.map((id) => {
          const solver = solversById.get(id)!
          const isSelected = selectedSolverId === id
          return (
            <div
              key={id}
              className={`rf-px-3 rf-py-2 rf-cursor-pointer rf-border-b rf-border-gray-100 ${
                isSelected
                  ? "rf-bg-blue-50 rf-border-l-2 rf-border-l-blue-500"
                  : "hover:rf-bg-gray-50"
              }`}
              onClick={() => setSelectedSolverId(id)}
            >
              <div className="rf-flex rf-items-center rf-gap-2">
                <Box className="rf-w-4 rf-h-4 rf-text-blue-500 rf-flex-shrink-0" />
                <div className="rf-flex-1 rf-min-w-0">
                  <div className="rf-text-sm rf-font-medium rf-text-gray-800 rf-truncate">
                    {solver.componentName}
                  </div>
                  <div className="rf-text-xs rf-text-gray-500 rf-truncate">
                    {solver.solverName}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Solver Details Panel */}
      <div className="rf-flex-1 rf-overflow-hidden">
        {selectedSolverEvent ? (
          selectedSolverInstance ? (
            <ErrorBoundary
              fallback={
                <div className="rf-p-4">
                  <div className="rf-bg-red-50 rf-rounded-md rf-border rf-border-red-200 rf-p-4">
                    <h3 className="rf-text-lg rf-font-semibold rf-text-red-800 rf-mb-2">
                      Error Loading Solver Debugger
                    </h3>
                    <p className="rf-text-sm rf-text-red-600">
                      Failed to render the solver debugger for{" "}
                      {selectedSolverEvent.solverName}
                    </p>
                  </div>
                </div>
              }
            >
              <GenericSolverDebugger solver={selectedSolverInstance} />
            </ErrorBoundary>
          ) : (
            <div className="rf-p-4">
              <div className="rf-mb-4">
                <h3 className="rf-text-lg rf-font-semibold rf-text-gray-800">
                  {selectedSolverEvent.solverName}
                </h3>
                <p className="rf-text-sm rf-text-gray-500">
                  Component: {selectedSolverEvent.componentName}
                </p>
              </div>
              <div className="rf-bg-yellow-50 rf-rounded-md rf-border rf-border-yellow-200 rf-p-4 rf-mb-4">
                <p className="rf-text-sm rf-text-yellow-700">
                  Solver class "{selectedSolverEvent.solverName}" not found in
                  SOLVERS registry. Showing raw parameters instead.
                </p>
              </div>
              <div className="rf-border rf-border-gray-200 rf-rounded-md rf-overflow-hidden">
                <div className="rf-px-3 rf-py-2 rf-bg-gray-50">
                  <span className="rf-text-sm rf-font-medium rf-text-gray-700">
                    Solver Parameters
                  </span>
                </div>
                <div className="rf-p-3 rf-bg-white rf-border-t rf-border-gray-200">
                  <pre className="rf-text-xs rf-font-mono rf-text-gray-600 rf-whitespace-pre-wrap rf-overflow-x-auto">
                    {JSON.stringify(selectedSolverEvent.solverParams, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="rf-flex rf-items-center rf-justify-center rf-h-full">
            <p className="rf-text-sm rf-text-gray-500">
              Select a solver from the list to view details
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
