import { useState, useMemo } from "react"
import { Box } from "lucide-react"
import type { SolverStartedEvent } from "../CircuitJsonPreview/PreviewContentProps"
import { SOLVERS } from "@tscircuit/core"
import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { ErrorBoundary } from "react-error-boundary"
import { useInjectTailwind } from "../../hooks/useInjectTailwind"

interface SolversTabContentProps {
  solverEvents?: SolverStartedEvent[]
}

interface SolverResult {
  instance: any | null
  error: string | null
  classFound: boolean
}

export const SolversTabContent = ({
  solverEvents = [],
}: SolversTabContentProps) => {
  const [selectedSolverId, setSelectedSolverId] = useState<string | null>(null)

  useInjectTailwind()

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
  const solverResult = useMemo<SolverResult>(() => {
    if (!selectedSolverEvent) {
      return { instance: null, error: null, classFound: false }
    }

    const SolverClass = (SOLVERS as Record<string, any>)[
      selectedSolverEvent.solverName
    ]
    if (!SolverClass) {
      return {
        instance: null,
        error: `Solver class "${selectedSolverEvent.solverName}" not found in SOLVERS registry. Available: ${Object.keys(SOLVERS).join(", ")}`,
        classFound: false,
      }
    }

    try {
      // HACK: if "input" is in the result, use that as the constructor parameter
      const params = selectedSolverEvent.solverParams as Record<string, unknown>
      const constructorArg = params?.input !== undefined ? params.input : params
      const instance = new SolverClass(constructorArg)
      return { instance, error: null, classFound: true }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      console.error("Failed to reconstruct solver:", e)
      return {
        instance: null,
        error: `Failed to instantiate solver: ${errorMessage}`,
        classFound: true,
      }
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
          solverResult.instance ? (
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
              <GenericSolverDebugger solver={solverResult.instance} />
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
              {solverResult.error && (
                <div
                  className={`rf-rounded-md rf-border rf-p-4 rf-mb-4 ${
                    solverResult.classFound
                      ? "rf-bg-red-50 rf-border-red-200"
                      : "rf-bg-yellow-50 rf-border-yellow-200"
                  }`}
                >
                  <p
                    className={`rf-text-sm ${
                      solverResult.classFound
                        ? "rf-text-red-700"
                        : "rf-text-yellow-700"
                    }`}
                  >
                    {solverResult.error}
                  </p>
                </div>
              )}
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
