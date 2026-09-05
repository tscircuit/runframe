import type { SimpleRouteJson, SimplifiedPcbTrace } from "@tscircuit/core"
import type {
  AnyCircuitElement,
  CircuitJson,
  LayerRef,
  PcbTrace,
  PcbTraceRoutePoint,
  PcbVia,
} from "circuit-json"
import type { Circle, GraphicsObject, Line } from "graphics-debug"
import type { AutoroutingPhase, AutoroutingPhaseView } from "./types"

export const AUTOROUTING_PHASE_HIGHLIGHT_COLOR = "#fbbf24"

/** Output can contain either new traces or the complete set of preloaded traces. */
function getOutputTraces(phase: AutoroutingPhase): SimplifiedPcbTrace[] {
  const outputTraces = phase.endSimpleRouteJson?.traces ?? []
  const replacedTraceIds = new Set(
    outputTraces.flatMap((trace) =>
      [trace.pcb_trace_id, trace.__replaces_pcb_trace_id].filter(
        (traceId): traceId is string => traceId !== undefined,
      ),
    ),
  )
  const preloadedTraces = (phase.startSimpleRouteJson?.traces ?? []).filter(
    (trace) => !replacedTraceIds.has(trace.pcb_trace_id),
  )
  return [...preloadedTraces, ...outputTraces]
}

export function getAutoroutingPhaseChangedTraceIds(
  phase: AutoroutingPhase,
): string[] {
  const inputTracesById = new Map(
    (phase.startSimpleRouteJson?.traces ?? []).map((trace) => [
      trace.pcb_trace_id,
      trace,
    ]),
  )
  return (phase.endSimpleRouteJson?.traces ?? [])
    .filter((trace) => {
      const inputTrace = inputTracesById.get(trace.pcb_trace_id)
      return (
        !inputTrace ||
        (Boolean(trace.__replaces_pcb_trace_id) &&
          trace.__replaces_pcb_trace_id !==
            inputTrace.__replaces_pcb_trace_id) ||
        JSON.stringify(inputTrace.route) !== JSON.stringify(trace.route)
      )
    })
    .map((trace) => trace.pcb_trace_id)
}

function getViaDimensions(
  routePoint: Extract<
    SimplifiedPcbTrace["route"][number],
    { route_type: "via" }
  >,
  simpleRouteJson: SimpleRouteJson,
) {
  return {
    outer_diameter:
      routePoint.via_diameter ??
      simpleRouteJson.minViaPadDiameter ??
      simpleRouteJson.min_via_pad_diameter ??
      simpleRouteJson.minViaDiameter ??
      0.6,
    hole_diameter:
      routePoint.via_hole_diameter ??
      simpleRouteJson.minViaHoleDiameter ??
      simpleRouteJson.min_via_hole_diameter ??
      0.3,
  }
}

/**
 * SRJ and Circuit JSON use board-world points in mm (+X right, +Y up).
 * Copy their coordinates without applying a renderer-space transform.
 */
function getCircuitJsonTraceSegments(
  trace: SimplifiedPcbTrace,
  simpleRouteJson: SimpleRouteJson,
): PcbTraceRoutePoint[][] {
  const route: PcbTraceRoutePoint[] = []
  for (const point of trace.route) {
    if (point.route_type === "wire") {
      route.push({ ...point, layer: point.layer as LayerRef })
    } else if (point.route_type === "via") {
      route.push({
        route_type: "via",
        x: point.x,
        y: point.y,
        from_layer: point.from_layer as LayerRef,
        to_layer: point.to_layer as LayerRef,
        ...getViaDimensions(point, simpleRouteJson),
      })
    } else if (point.route_type === "through_obstacle") {
      route.push({
        route_type: "through_pad",
        start: { ...point.start },
        end: { ...point.end },
        width: point.width,
        start_layer: point.from_layer as LayerRef,
        end_layer: point.to_layer as LayerRef,
        pcb_smtpad_id: point.circuitJsonMetadata?.pcb_smtpad_id,
        pcb_plated_hole_id: point.circuitJsonMetadata?.pcb_plated_hole_id,
      })
    }
  }
  // Core's split-pcb-traces-on-jumper-segments matches jumper endpoints to wire
  // points: jumper descriptors may be appended instead of appearing in order.
  const nearestWireIndex = (point: { x: number; y: number }) => {
    let nearestIndex = -1
    let nearestDistance = Number.POSITIVE_INFINITY
    route.forEach((routePoint, index) => {
      if (routePoint.route_type !== "wire") return
      const distance = Math.hypot(
        routePoint.x - point.x,
        routePoint.y - point.y,
      )
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    })
    return nearestIndex
  }
  const jumperRanges = trace.route
    .filter((point) => point.route_type === "jumper")
    .map((jumper) =>
      [nearestWireIndex(jumper.start), nearestWireIndex(jumper.end)].sort(
        (a, b) => a - b,
      ),
    )
    .filter(([start, end]) => start >= 0 && end > start)
    .sort(([firstStart], [secondStart]) => firstStart - secondStart)
  const segments: PcbTraceRoutePoint[][] = []
  let segmentStart = 0
  for (const [jumperStart, jumperEnd] of jumperRanges) {
    if (jumperStart >= segmentStart) {
      segments.push(route.slice(segmentStart, jumperStart + 1))
    }
    segmentStart = Math.max(segmentStart, jumperEnd)
  }
  if (segmentStart < route.length) segments.push(route.slice(segmentStart))
  return segments
}

/**
 * A presentation overlay only: the native viewer draws debug graphics across
 * all copper layers. Points stay in board-world mm (+X right, +Y up).
 */
export function getAutoroutingPhaseHighlightGraphics(
  phase: AutoroutingPhase,
): GraphicsObject {
  const lines: Line[] = []
  const circles: Circle[] = []
  const simpleRouteJson = phase.endSimpleRouteJson
  if (!simpleRouteJson) return { lines, circles }
  const changedTraceIds = new Set(getAutoroutingPhaseChangedTraceIds(phase))
  for (const trace of simpleRouteJson.traces ?? []) {
    if (!changedTraceIds.has(trace.pcb_trace_id)) continue
    for (const segment of getCircuitJsonTraceSegments(trace, simpleRouteJson)) {
      let previousPoint:
        | { x: number; y: number; layer: LayerRef; width: number }
        | undefined
      for (const point of segment) {
        if (point.route_type === "through_pad") {
          // Do not paint pad interiors as routed copper.
          previousPoint = {
            ...point.end,
            layer: point.end_layer,
            width: point.width,
          }
          continue
        }
        const layer =
          point.route_type === "wire" ? point.layer : point.from_layer
        if (
          previousPoint &&
          previousPoint.layer === layer &&
          (previousPoint.x !== point.x || previousPoint.y !== point.y)
        ) {
          lines.push({
            points: [
              { x: previousPoint.x, y: previousPoint.y },
              { x: point.x, y: point.y },
            ],
            strokeWidth:
              point.route_type === "wire" ? point.width : previousPoint.width,
            strokeColor: AUTOROUTING_PHASE_HIGHLIGHT_COLOR,
            layer,
          })
        }
        if (point.route_type === "via") {
          circles.push({
            center: { x: point.x, y: point.y },
            radius: point.outer_diameter! / 2,
            stroke: AUTOROUTING_PHASE_HIGHLIGHT_COLOR,
            fill: "transparent",
          })
        }
        previousPoint = {
          x: point.x,
          y: point.y,
          layer: point.route_type === "wire" ? point.layer : point.to_layer,
          width:
            point.route_type === "wire"
              ? point.width
              : (previousPoint?.width ?? simpleRouteJson.minTraceWidth),
        }
      }
    }
  }
  return { coordinateSystem: "cartesian", lines, circles }
}

function getRouteGeometryHash(route: PcbTraceRoutePoint[]): string {
  const geometry = JSON.stringify(route)
  let hash = 2166136261
  for (let index = 0; index < geometry.length; index++) {
    hash = Math.imul(hash ^ geometry.charCodeAt(index), 16777619)
  }
  return (hash >>> 0).toString(36)
}

const finalRoutingTypes = new Set<AnyCircuitElement["type"]>([
  "pcb_trace",
  "pcb_via",
  "pcb_copper_pour",
  "pcb_ground_plane",
  "pcb_ground_plane_region",
  "pcb_thermal_spoke",
  "pcb_breakout_point",
])

/**
 * Render captured copper against the real board, footprints, and silkscreen.
 * Final traces/vias/pours and final DRC findings are removed globally: the final
 * document cannot establish which other groups had already routed at this time.
 * All geometry remains in board-world coordinates (mm, +X right and +Y up).
 */
export function buildAutoroutingPhaseCircuitJson(
  circuitJson: CircuitJson,
  phase: AutoroutingPhase,
  view: AutoroutingPhaseView,
): CircuitJson {
  const simpleRouteJson =
    view === "input"
      ? (phase.startSimpleRouteJson ?? phase.errorSimpleRouteJson)
      : phase.endSimpleRouteJson
  const context = circuitJson.filter(
    (element) =>
      !finalRoutingTypes.has(element.type) &&
      !element.type.endsWith("_error") &&
      !element.type.endsWith("_warning"),
  )
  if (!simpleRouteJson) return context

  const traces =
    view === "input" ? (simpleRouteJson.traces ?? []) : getOutputTraces(phase)
  const sourceTraceIds = new Set(
    circuitJson
      .filter((element) => element.type === "source_trace")
      .map((trace) => trace.source_trace_id),
  )
  const layerStack: LayerRef[] = [
    "top",
    ...Array.from(
      { length: Math.max(0, simpleRouteJson.layerCount - 2) },
      (_, layerIndex) => `inner${layerIndex + 1}` as LayerRef,
    ),
    ...(simpleRouteJson.layerCount > 1 ? ["bottom" as const] : []),
  ]
  const snapshotCopper: CircuitJson = []
  for (const trace of traces) {
    const connection = simpleRouteJson.connections.find(
      (connection) =>
        connection.name === trace.connection_name ||
        connection.source_trace_id === trace.connection_name,
    )
    const sourceTraceId =
      connection?.source_trace_id ?? trace.connection_name ?? ""
    const segments = getCircuitJsonTraceSegments(trace, simpleRouteJson)
    for (const [segmentIndex, route] of segments.entries()) {
      const pcbTrace: PcbTrace = {
        type: "pcb_trace",
        // PCBViewer's cache only considers IDs, bounds, and route length.
        // Include geometry so same-bounds reroutes invalidate it while keeping
        // the board ID and camera stable across Input/Output and phase changes.
        pcb_trace_id: `${phase.id}_${view}_${trace.pcb_trace_id}_${segmentIndex}_${getRouteGeometryHash(route)}`,
        subcircuit_id: phase.subcircuit_id ?? undefined,
        source_trace_id: sourceTraceIds.has(sourceTraceId)
          ? sourceTraceId
          : undefined,
        route,
      }
      snapshotCopper.push(pcbTrace)
      for (const [routeIndex, point] of route.entries()) {
        if (point.route_type !== "via") continue
        const fromLayerIndex = layerStack.indexOf(point.from_layer)
        const toLayerIndex = layerStack.indexOf(point.to_layer)
        const pcbVia: PcbVia = {
          type: "pcb_via",
          pcb_via_id: `${pcbTrace.pcb_trace_id}_via_${routeIndex}`,
          pcb_trace_id: pcbTrace.pcb_trace_id,
          subcircuit_id: phase.subcircuit_id ?? undefined,
          x: point.x,
          y: point.y,
          outer_diameter: point.outer_diameter!,
          hole_diameter: point.hole_diameter!,
          layers:
            fromLayerIndex >= 0 && toLayerIndex >= 0
              ? layerStack.slice(
                  Math.min(fromLayerIndex, toLayerIndex),
                  Math.max(fromLayerIndex, toLayerIndex) + 1,
                )
              : [point.from_layer, point.to_layer],
        }
        snapshotCopper.push(pcbVia)
      }
    }
  }
  return [...context, ...snapshotCopper]
}
