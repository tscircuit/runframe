import { PCBViewer } from "@tscircuit/pcb-viewer"
import type { CircuitJson } from "circuit-json"
import {
  buildAutoroutingPhaseCircuitJson,
  getAutoroutingPhaseHighlightGraphics,
  AUTOROUTING_PHASE_HIGHLIGHT_COLOR,
  type AutoroutingPhase,
} from "lib/autorouting"
import { cn } from "lib/utils"
import {
  Check,
  ChevronRight,
  CircleAlert,
  Download,
  Loader2,
  Route,
} from "lucide-react"
import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { openForDownload } from "../../optional-features/exporting/open-for-download"

interface AutoroutingTabContentProps {
  circuitJson: CircuitJson | null
  phases?: AutoroutingPhase[]
  isRunning?: boolean
}

const getPhaseTitle = (phase: AutoroutingPhase, index: number) =>
  phase.phaseName || `Phase ${phase.phaseOrdinal ?? index + 1}`

const getPhaseScope = (phase: AutoroutingPhase) => {
  const name = phase.componentDisplayName?.match(/name="([^"]+)"/)?.[1]
  return (
    name?.replace(/^\./, "") ||
    phase.componentDisplayName ||
    phase.subcircuit_id ||
    "Board"
  )
}

const getCaptureSource = (phase: AutoroutingPhase) =>
  phase.startSimpleRouteJson ??
  phase.endSimpleRouteJson ??
  phase.errorSimpleRouteJson

const viewerInitialState = {
  is_showing_autorouting: true,
  is_showing_rats_nest: false,
  is_showing_drc_errors: false,
  is_showing_drc_warnings: false,
  is_showing_pcb_groups: false,
}

export const AutoroutingTabContent = ({
  circuitJson,
  phases = [],
  isRunning = false,
}: AutoroutingTabContentProps) => {
  // Keep a capture identity as well as its ID: IDs can repeat in a new run.
  const [pinnedPhase, setPinnedPhase] = useState<AutoroutingPhase | null>(null)
  const [mode, setMode] = useState<"input" | "output">("output")
  const [highlightChanges, setHighlightChanges] = useState(true)
  const [showJson, setShowJson] = useState(false)
  const viewerContainer = useRef<HTMLDivElement>(null)
  const [viewerHeight, setViewerHeight] = useState(480)
  const pinnedIndex = pinnedPhase
    ? phases.findIndex(
        (phase) =>
          phase.id === pinnedPhase.id &&
          getCaptureSource(phase) === getCaptureSource(pinnedPhase),
      )
    : -1
  const selectedIndex = pinnedIndex < 0 ? phases.length - 1 : pinnedIndex
  const selectedPhase = phases[selectedIndex]
  const followLatest = pinnedIndex < 0
  const hasOutput = Boolean(selectedPhase?.endSimpleRouteJson)
  const inputSnapshot =
    selectedPhase?.startSimpleRouteJson ?? selectedPhase?.errorSimpleRouteJson
  const hasInput = Boolean(inputSnapshot)
  const actualMode =
    mode === "output" && !hasOutput
      ? "input"
      : mode === "input" && !hasInput
        ? "output"
        : mode
  const snapshot =
    actualMode === "input" ? inputSnapshot : selectedPhase?.endSimpleRouteJson
  const phaseCircuitJson = useMemo(() => {
    if (!selectedPhase || !snapshot) return null
    return buildAutoroutingPhaseCircuitJson(
      circuitJson ?? [],
      selectedPhase,
      actualMode,
    )
  }, [circuitJson, selectedPhase, snapshot, actualMode])
  const highlightGraphics = useMemo(
    () =>
      selectedPhase && actualMode === "output" && highlightChanges
        ? getAutoroutingPhaseHighlightGraphics(selectedPhase)
        : { lines: [], circles: [] },
    [selectedPhase, actualMode, highlightChanges],
  )

  useLayoutEffect(() => {
    const container = viewerContainer.current
    if (!container) return
    const resize = () => setViewerHeight(Math.max(360, container.clientHeight))
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [Boolean(selectedPhase)])

  if (!selectedPhase) {
    return (
      <div className="rf-flex rf-min-h-[400px] rf-flex-col rf-items-center rf-justify-center rf-gap-3 rf-p-8 rf-text-center">
        <Route className="rf-h-7 rf-w-7 rf-text-blue-500" />
        <h3 className="rf-text-base rf-font-medium">
          {isRunning ? "Waiting for autorouting" : "No autorouting captures"}
        </h3>
        <p className="rf-max-w-md rf-text-sm rf-text-gray-500">
          {isRunning
            ? "Phases appear as the circuit routes. Each capture includes its input and output on the PCB."
            : "Run a circuit with autorouting enabled to inspect its phases. A circuit JSON file alone does not include routing history."}
        </p>
      </div>
    )
  }

  const title = getPhaseTitle(selectedPhase, selectedIndex)
  const active = selectedPhase.status === "running" && isRunning
  const outputMissing = !hasOutput
  const inputConnections = inputSnapshot?.connections.length
  const traceCount =
    phaseCircuitJson?.filter((element) => element.type === "pcb_trace")
      .length ?? 0

  return (
    <div
      className="rf-flex rf-h-full rf-min-h-[620px] rf-flex-col rf-bg-white md:rf-flex-row"
      data-testid="autorouting-explorer"
    >
      <aside
        className="rf-flex rf-shrink-0 rf-flex-col rf-border-b rf-border-gray-200 md:rf-w-56 md:rf-border-b-0 md:rf-border-r"
        aria-label="Routing phases"
      >
        <div className="rf-flex rf-items-center rf-justify-between rf-px-4 rf-py-3 rf-text-xs rf-text-gray-500">
          <span>Routing phases</span>
          <span>{phases.length} captures</span>
        </div>
        <div className="rf-flex rf-gap-1 rf-overflow-x-auto rf-p-2 md:rf-flex-col md:rf-overflow-x-hidden md:rf-overflow-y-auto">
          {phases.map((phase, index) => (
            <button
              key={phase.id}
              type="button"
              aria-pressed={index === selectedIndex}
              onClick={() => setPinnedPhase(phase)}
              className={cn(
                "rf-flex rf-min-w-[180px] rf-items-start rf-gap-2 rf-rounded-md rf-border rf-px-3 rf-py-3 rf-text-left md:rf-min-w-0",
                index === selectedIndex
                  ? "rf-border-blue-200 rf-bg-blue-50"
                  : "rf-border-transparent hover:rf-bg-gray-50",
              )}
            >
              <span
                className={cn(
                  "rf-flex rf-h-5 rf-w-5 rf-shrink-0 rf-items-center rf-justify-center rf-rounded-full rf-text-[11px]",
                  index === selectedIndex
                    ? "rf-bg-blue-600 rf-text-white"
                    : "rf-bg-gray-100 rf-text-gray-500",
                )}
              >
                {index + 1}
              </span>
              <span className="rf-min-w-0 rf-flex-1">
                <span className="rf-block rf-break-words rf-text-sm rf-font-medium rf-text-gray-800">
                  {getPhaseTitle(phase, index)}
                </span>
                <span
                  className="rf-mt-1 rf-block rf-break-all rf-text-[11px] rf-text-gray-500"
                  title={phase.componentDisplayName}
                >
                  {getPhaseScope(phase)}
                </span>
                <span className="rf-mt-1 rf-block rf-text-[11px] rf-text-gray-500">
                  {phase.status === "complete"
                    ? "Captured"
                    : phase.status === "error"
                      ? "Failed"
                      : isRunning
                        ? "Routing…"
                        : "Input only"}
                </span>
              </span>
              {phase.status === "complete" ? (
                <Check className="rf-mt-0.5 rf-h-3.5 rf-w-3.5 rf-shrink-0 rf-text-green-600" />
              ) : phase.status === "error" ? (
                <CircleAlert className="rf-h-4 rf-w-4 rf-shrink-0 rf-text-red-500" />
              ) : isRunning ? (
                <Loader2 className="rf-h-4 rf-w-4 rf-shrink-0 rf-animate-spin rf-text-blue-500" />
              ) : null}
            </button>
          ))}
        </div>
        <div className="rf-mt-auto rf-hidden rf-border-t rf-border-gray-200 rf-p-4 rf-text-xs rf-text-gray-500 md:rf-block">
          {isRunning ? "Capturing current run" : "Captured routing history"}
          <span className="rf-mt-1 rf-block rf-text-[11px]">
            PCB geometry stays fixed between snapshots.
          </span>
        </div>
      </aside>
      <div className="rf-flex rf-min-w-0 rf-flex-1 rf-flex-col">
        <div className="rf-flex rf-flex-wrap rf-items-center rf-gap-3 rf-border-b rf-border-gray-200 rf-px-4 rf-py-3">
          <h3 className="rf-mr-auto rf-flex rf-items-center rf-gap-2 rf-text-sm rf-font-medium">
            {title}
            <span className="rf-text-xs rf-font-normal rf-text-gray-500">
              {selectedIndex + 1} of {phases.length}
            </span>
          </h3>
          {isRunning && (
            <button
              type="button"
              onClick={() => setPinnedPhase(null)}
              disabled={followLatest}
              className="rf-text-xs rf-text-blue-600 disabled:rf-text-gray-500"
            >
              {followLatest ? "Following latest" : "Follow latest"}
            </button>
          )}
          <div
            className="rf-flex rf-rounded-md rf-bg-gray-100 rf-p-1"
            aria-label="Phase snapshot"
          >
            {(["input", "output"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={actualMode === value}
                disabled={value === "input" ? !hasInput : !hasOutput}
                onClick={() => setMode(value)}
                className={cn(
                  "rf-rounded rf-px-3 rf-py-1 rf-text-xs disabled:rf-opacity-40",
                  actualMode === value
                    ? "rf-bg-white rf-text-gray-900 rf-shadow-sm"
                    : "rf-text-gray-500",
                )}
              >
                {value === "input" ? "Input" : "Output"}
              </button>
            ))}
          </div>
        </div>
        <div className="rf-flex rf-flex-wrap rf-items-center rf-justify-between rf-gap-2 rf-px-4 rf-py-2 rf-text-xs rf-text-gray-600">
          <label className="rf-flex rf-items-center rf-gap-2">
            <input
              type="checkbox"
              checked={highlightChanges}
              disabled={actualMode !== "output"}
              onChange={(event) => setHighlightChanges(event.target.checked)}
              className="rf-accent-blue-600"
            />
            <span
              aria-hidden="true"
              className="rf-inline-block rf-h-0.5 rf-w-3"
              style={{ backgroundColor: AUTOROUTING_PHASE_HIGHLIGHT_COLOR }}
            />
            Highlight changes (all layers)
          </label>
          <span>
            {actualMode === "input" ? "Before this phase" : "After this phase"}{" "}
            · {traceCount} traces
          </span>
        </div>
        {outputMissing && (
          <div
            className={cn(
              "rf-border-y rf-px-4 rf-py-2 rf-text-xs",
              selectedPhase.status === "error"
                ? "rf-border-red-100 rf-bg-red-50 rf-text-red-700"
                : "rf-border-blue-100 rf-bg-blue-50 rf-text-blue-700",
            )}
            role="status"
          >
            {selectedPhase.status === "error"
              ? `Routing failed: ${selectedPhase.error?.message || "No output was captured."}`
              : active
                ? "Routing in progress. Showing captured input until output is available."
                : "No output was captured for this phase. Showing the available input."}
          </div>
        )}
        <div
          ref={viewerContainer}
          className="rf-relative rf-min-h-[360px] rf-flex-1"
          data-testid="autorouting-pcb"
        >
          {phaseCircuitJson ? (
            <PCBViewer
              circuitJson={phaseCircuitJson}
              height={viewerHeight}
              allowEditing={false}
              clickToInteractEnabled={false}
              initialState={viewerInitialState}
              debugGraphics={highlightGraphics}
            />
          ) : (
            <div className="rf-p-6 rf-text-sm rf-text-gray-500">
              No PCB snapshot available for this capture.
            </div>
          )}
        </div>
        <div className="rf-flex rf-flex-wrap rf-items-center rf-justify-between rf-gap-2 rf-border-t rf-border-gray-200 rf-px-4 rf-py-3 rf-text-xs rf-text-gray-500">
          <span>
            {inputConnections === undefined
              ? "Input unavailable"
              : `${inputConnections} input connections`}
            {selectedPhase.autorouterName
              ? ` · ${selectedPhase.autorouterName}`
              : ""}
          </span>
          <div className="rf-flex rf-items-center rf-gap-4">
            <button
              type="button"
              disabled={!snapshot}
              onClick={() =>
                openForDownload(JSON.stringify(snapshot, null, 2), {
                  fileName: `${selectedPhase.id}-${actualMode}.srj.json`,
                  mimeType: "application/json",
                })
              }
              className="rf-flex rf-items-center rf-gap-1 disabled:rf-opacity-40"
            >
              <Download className="rf-h-3 rf-w-3" />
              Download SRJ
            </button>
            <button
              type="button"
              aria-expanded={showJson}
              onClick={() => setShowJson(!showJson)}
              className="rf-flex rf-items-center rf-gap-1"
            >
              <ChevronRight
                className={cn("rf-h-3 rf-w-3", showJson && "rf-rotate-90")}
              />
              Inspect SRJ
            </button>
          </div>
        </div>
        {showJson && (
          <pre
            className="rf-m-0 rf-max-h-64 rf-overflow-auto rf-border-t rf-border-gray-200 rf-bg-gray-50 rf-p-4 rf-text-xs"
            aria-label={`${title} ${actualMode} SRJ`}
          >
            {snapshot
              ? JSON.stringify(snapshot, null, 2)
              : "No snapshot captured."}
          </pre>
        )}
      </div>
    </div>
  )
}
