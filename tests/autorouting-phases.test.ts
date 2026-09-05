import { describe, expect, test } from "bun:test"
import type { SimpleRouteJson, SimplifiedPcbTrace } from "@tscircuit/core"
import { pcb_board, pcb_trace, pcb_via, type CircuitJson } from "circuit-json"
import {
  AUTOROUTING_PHASE_HIGHLIGHT_COLOR,
  buildAutoroutingPhaseCircuitJson,
  captureAutoroutingPhase,
  getAutoroutingPhaseChangedTraceIds,
  getAutoroutingPhaseHighlightGraphics,
  type AutoroutingPhase,
  type AutoroutingPhaseEvent,
} from "../lib/autorouting"
import recordedSensor from "../examples/assets/autorouting-sensor.json"

const makeTrace = (id: string, y = 0): SimplifiedPcbTrace => ({
  type: "pcb_trace",
  pcb_trace_id: id,
  route: [
    { route_type: "wire", x: -2, y, width: 0.2, layer: "top" },
    { route_type: "wire", x: 2, y, width: 0.2, layer: "top" },
  ],
})

const makeSrj = (traces: SimplifiedPcbTrace[] = []): SimpleRouteJson => ({
  layerCount: 4,
  minTraceWidth: 0.2,
  minViaPadDiameter: 0.7,
  minViaHoleDiameter: 0.25,
  bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
  obstacles: [],
  connections: [],
  traces,
})

const makeEvent = (
  type: AutoroutingPhaseEvent["type"],
  overrides: Partial<AutoroutingPhaseEvent> = {},
): AutoroutingPhaseEvent => ({
  type,
  subcircuit_id: "subcircuit_board",
  componentDisplayName: "<board />",
  simpleRouteJson: makeSrj(),
  ...overrides,
})

const makePhase = (
  input: SimplifiedPcbTrace[],
  output: SimplifiedPcbTrace[],
): AutoroutingPhase => ({
  id: "phase",
  status: "complete",
  subcircuit_id: "subcircuit_board",
  startSimpleRouteJson: makeSrj(input),
  endSimpleRouteJson: makeSrj(output),
})

describe("captureAutoroutingPhase", () => {
  test("freezes solver-owned snapshots in time without mutating previous state", () => {
    const input = makeSrj([makeTrace("preloaded")])
    const started = captureAutoroutingPhase(
      [],
      makeEvent("autorouting:start", { simpleRouteJson: input }),
    )
    input.traces!.push(makeTrace("solver_mutation"))
    const output = makeSrj([makeTrace("new")])
    const completed = captureAutoroutingPhase(
      started,
      makeEvent("autorouting:end", { simpleRouteJson: output }),
    )
    output.traces![0].route[0] = {
      route_type: "wire",
      x: 99,
      y: 99,
      width: 0.2,
      layer: "bottom",
    }

    expect(started[0].status).toBe("running")
    expect(started[0].endSimpleRouteJson).toBeUndefined()
    expect(completed[0].startSimpleRouteJson?.traces).toHaveLength(1)
    expect(completed[0].endSimpleRouteJson?.traces?.[0].route[0]).toMatchObject(
      {
        x: -2,
        y: 0,
        layer: "top",
      },
    )
    expect(completed[0].id).toBe(started[0].id)
  })

  test("pairs interleaved phases by scope and stage metadata rather than name alone", () => {
    let phases: AutoroutingPhase[] = []
    for (const phaseOrdinal of [1, 2]) {
      phases = captureAutoroutingPhase(
        phases,
        makeEvent("autorouting:start", {
          phaseName: "Fanout",
          phaseOrdinal,
          phaseStageIndex: 0,
          phaseCount: 2,
          autorouterName: "fanout",
        }),
      )
    }
    phases = captureAutoroutingPhase(
      phases,
      makeEvent("autorouting:start", { subcircuit_id: "subcircuit_other" }),
    )
    phases = captureAutoroutingPhase(
      phases,
      makeEvent("autorouting:end", {
        phaseName: "Fanout",
        phaseOrdinal: 1,
        phaseStageIndex: 0,
        solverName: "FanoutSolver",
      }),
    )

    expect(phases.map((phase) => phase.status)).toEqual([
      "complete",
      "running",
      "running",
    ])
    expect(phases[0]).toMatchObject({
      phaseCount: 2,
      autorouterName: "fanout",
      solverName: "FanoutSolver",
    })
    expect(new Set(phases.map((phase) => phase.id)).size).toBe(3)
  })

  test("keeps repeated legacy phases separate and handles errors without an end event", () => {
    let phases = captureAutoroutingPhase([], makeEvent("autorouting:start"))
    phases = captureAutoroutingPhase(phases, makeEvent("autorouting:end"))
    phases = captureAutoroutingPhase(phases, makeEvent("autorouting:start"))
    const failedSrj = makeSrj([makeTrace("failure_context")])
    const error = { message: "No path found", stack: "router stack" }
    phases = captureAutoroutingPhase(
      phases,
      makeEvent("autorouting:error", { simpleRouteJson: failedSrj, error }),
    )
    error.message = "mutated"
    failedSrj.traces!.length = 0

    expect(phases).toHaveLength(2)
    expect(phases[0].status).toBe("complete")
    expect(phases[1]).toMatchObject({
      status: "error",
      error: { message: "No path found" },
    })
    expect(phases[1].errorSimpleRouteJson?.traces).toHaveLength(1)
    expect(phases[1].endSimpleRouteJson).toBeUndefined()
  })

  test("retains unpaired terminal events without attaching them to a conflicting phase", () => {
    const phases = captureAutoroutingPhase(
      captureAutoroutingPhase(
        [],
        makeEvent("autorouting:start", { phaseOrdinal: 1 }),
      ),
      makeEvent("autorouting:end", { phaseOrdinal: 2 }),
    )
    expect(phases).toHaveLength(2)
    expect(phases[0].status).toBe("running")
    expect(phases[1].status).toBe("complete")
    expect(phases[1].startSimpleRouteJson).toBeUndefined()
  })
})

describe("buildAutoroutingPhaseCircuitJson", () => {
  const board = pcb_board.parse({
    type: "pcb_board",
    pcb_board_id: "board",
    width: 10,
    height: 10,
    center: { x: 0, y: 0 },
    num_layers: 4,
  })

  test("merges partial and cumulative outputs while honoring trace replacement IDs", () => {
    const input = [makeTrace("keep"), makeTrace("replaced", 1)]
    const replacement = {
      ...makeTrace("replacement", 2),
      __replaces_pcb_trace_id: "replaced",
    }
    const phase = makePhase(input, [makeTrace("keep"), replacement])
    const result = buildAutoroutingPhaseCircuitJson([board], phase, "output")
    expect(
      result
        .filter((element) => element.type === "pcb_trace")
        .map((trace) => trace.route),
    ).toEqual([input[0].route, replacement.route])
    expect(phase.startSimpleRouteJson?.traces).toEqual(input)

    phase.endSimpleRouteJson!.traces = [replacement]
    expect(
      buildAutoroutingPhaseCircuitJson([board], phase, "output").filter(
        (element) => element.type === "pcb_trace",
      ),
    ).toHaveLength(2)
  })

  test("does not leak final copper or DRC findings into earlier snapshots", () => {
    const phase = makePhase([], [makeTrace("phase_copper")])
    const circuitJson = recordedSensor.circuitJson as CircuitJson
    const original = JSON.stringify(circuitJson)
    const input = buildAutoroutingPhaseCircuitJson(circuitJson, phase, "input")

    expect(input.some((element) => element.type === "pcb_smtpad")).toBe(true)
    expect(input.some((element) => element.type === "pcb_board")).toBe(true)
    expect(
      input.some((element) => element.type === "pcb_silkscreen_text"),
    ).toBe(true)
    expect(
      input.some((element) =>
        [
          "pcb_trace",
          "pcb_via",
          "pcb_copper_pour",
          "pcb_ground_plane",
          "pcb_ground_plane_region",
        ].includes(element.type),
      ),
    ).toBe(false)
    expect(input.some((element) => element.type.endsWith("_error"))).toBe(false)
    expect(JSON.stringify(circuitJson)).toBe(original)
  })

  test("creates real via spans and through-pad references in the same board coordinates", () => {
    const phase = makePhase(
      [],
      [
        {
          ...makeTrace("via_trace"),
          route: [
            { route_type: "wire", x: -2, y: 1, width: 0.2, layer: "top" },
            {
              route_type: "via",
              x: 1,
              y: 1,
              from_layer: "top",
              to_layer: "inner2",
              via_diameter: 0.65,
            },
            { route_type: "wire", x: 2, y: 1, width: 0.2, layer: "inner2" },
            {
              route_type: "through_obstacle",
              start: { x: 2, y: 1 },
              end: { x: 3, y: 1 },
              width: 0.2,
              from_layer: "inner2",
              to_layer: "bottom",
              circuitJsonMetadata: { pcb_plated_hole_id: "existing_hole" },
            },
          ],
        },
      ],
    )
    const result = buildAutoroutingPhaseCircuitJson([board], phase, "output")
    const trace = result.find((element) => element.type === "pcb_trace")!
    const via = result.find((element) => element.type === "pcb_via")!
    expect(pcb_trace.safeParse(trace).success).toBe(true)
    expect(pcb_via.safeParse(via).success).toBe(true)
    expect(via).toMatchObject({
      x: 1,
      y: 1,
      outer_diameter: 0.65,
      hole_diameter: 0.25,
      layers: ["top", "inner1", "inner2"],
    })
    expect(trace.route[3]).toMatchObject({
      route_type: "through_pad",
      pcb_plated_hole_id: "existing_hole",
      start_layer: "inner2",
      end_layer: "bottom",
    })
    expect(result.some((element) => element.type === "pcb_smtpad")).toBe(false)
  })

  test("separates changed-route highlights from the complete captured output copper", () => {
    const phase = makePhase(
      [makeTrace("keep"), makeTrace("changed")],
      [makeTrace("keep"), makeTrace("changed", 2), makeTrace("new", 3)],
    )
    expect(getAutoroutingPhaseChangedTraceIds(phase)).toEqual([
      "changed",
      "new",
    ])
    const traces = buildAutoroutingPhaseCircuitJson(
      [board],
      phase,
      "output",
    ).filter((element) => element.type === "pcb_trace")
    expect(traces).toHaveLength(3)
    expect(traces.every((trace) => trace.highlight_color === undefined)).toBe(
      true,
    )
    const graphics = getAutoroutingPhaseHighlightGraphics(phase)
    expect(graphics.lines?.map((line) => line.points)).toEqual([
      [
        { x: -2, y: 2 },
        { x: 2, y: 2 },
      ],
      [
        { x: -2, y: 3 },
        { x: 2, y: 3 },
      ],
    ])
    expect(
      graphics.lines?.every(
        (line) => line.strokeColor === AUTOROUTING_PHASE_HIGHLIGHT_COLOR,
      ),
    ).toBe(true)
  })

  test("same-length reroutes inside the same bounds invalidate native viewer caches without changing the board", () => {
    const firstTrace = makeTrace("same_id")
    firstTrace.route = [
      { route_type: "wire", x: -2, y: -2, width: 0.2, layer: "top" },
      { route_type: "wire", x: 0, y: 1, width: 0.2, layer: "top" },
      { route_type: "wire", x: 2, y: 2, width: 0.2, layer: "top" },
    ]
    const reroutedTrace = structuredClone(firstTrace)
    reroutedTrace.route[1] = {
      route_type: "wire",
      x: 0,
      y: -1,
      width: 0.2,
      layer: "top",
    }
    const phase = makePhase([firstTrace], [reroutedTrace])
    const input = buildAutoroutingPhaseCircuitJson([board], phase, "input")
    const output = buildAutoroutingPhaseCircuitJson([board], phase, "output")
    const previousOutput = buildAutoroutingPhaseCircuitJson(
      [board],
      makePhase([], [firstTrace]),
      "output",
    )
    const inputTrace = input.find((element) => element.type === "pcb_trace")!
    const outputTrace = output.find((element) => element.type === "pcb_trace")!
    const previousOutputTrace = previousOutput.find(
      (element) => element.type === "pcb_trace",
    )!
    expect(inputTrace.route).toHaveLength(outputTrace.route.length)
    expect(inputTrace.pcb_trace_id).not.toBe(outputTrace.pcb_trace_id)
    expect(previousOutputTrace.pcb_trace_id).not.toBe(outputTrace.pcb_trace_id)
    expect(input[0]).toBe(board)
    expect(output[0]).toBe(board)
    expect(buildAutoroutingPhaseCircuitJson([board], phase, "output")).toEqual(
      output,
    )
    expect(phase.startSimpleRouteJson?.traces?.[0].pcb_trace_id).toBe("same_id")
  })

  test("keeps vias linked to snapshot trace IDs and never highlights jumper or pad interiors as copper", () => {
    const phase = makePhase(
      [],
      [
        {
          ...makeTrace("mixed_route"),
          route: [
            { route_type: "wire", x: -4, y: 0, width: 0.2, layer: "top" },
            { route_type: "wire", x: -3, y: 0, width: 0.2, layer: "top" },
            {
              route_type: "through_obstacle",
              start: { x: -3, y: 0 },
              end: { x: -2, y: 0 },
              width: 0.2,
              from_layer: "top",
              to_layer: "top",
            },
            { route_type: "wire", x: -2, y: 0, width: 0.2, layer: "top" },
            { route_type: "wire", x: -1, y: 0, width: 0.2, layer: "top" },
            { route_type: "wire", x: 1, y: 0, width: 0.2, layer: "top" },
            { route_type: "wire", x: 2, y: 0, width: 0.2, layer: "top" },
            {
              route_type: "via",
              x: 3,
              y: 0,
              from_layer: "top",
              to_layer: "bottom",
            },
            { route_type: "wire", x: 4, y: 0, width: 0.2, layer: "bottom" },
            {
              route_type: "jumper",
              start: { x: -1, y: 0 },
              end: { x: 1, y: 0 },
              footprint: "0603",
              layer: "top",
            },
          ],
        },
      ],
    )
    const graphics = getAutoroutingPhaseHighlightGraphics(phase)
    expect(graphics.lines?.map((line) => line.points)).toEqual([
      [
        { x: -4, y: 0 },
        { x: -3, y: 0 },
      ],
      [
        { x: -2, y: 0 },
        { x: -1, y: 0 },
      ],
      [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ],
      [
        { x: 2, y: 0 },
        { x: 3, y: 0 },
      ],
      [
        { x: 3, y: 0 },
        { x: 4, y: 0 },
      ],
    ])
    expect(graphics.circles).toEqual([
      {
        center: { x: 3, y: 0 },
        radius: 0.35,
        stroke: AUTOROUTING_PHASE_HIGHLIGHT_COLOR,
        fill: "transparent",
      },
    ])
    const snapshot = buildAutoroutingPhaseCircuitJson([board], phase, "output")
    const traces = snapshot.filter((element) => element.type === "pcb_trace")
    const via = snapshot.find((element) => element.type === "pcb_via")!
    expect(traces).toHaveLength(2)
    expect(
      traces.some((trace) => trace.pcb_trace_id === via.pcb_trace_id),
    ).toBe(true)
    expect(via.pcb_via_id).toContain(via.pcb_trace_id!)
  })

  test("replays actual core fanout and global routing snapshots with all 13 output traces", () => {
    const phases = (recordedSensor.events as AutoroutingPhaseEvent[]).reduce(
      captureAutoroutingPhase,
      [] as AutoroutingPhase[],
    )
    expect(phases).toHaveLength(2)
    expect(phases.every((phase) => phase.status === "complete")).toBe(true)
    const input = buildAutoroutingPhaseCircuitJson(
      recordedSensor.circuitJson as CircuitJson,
      phases[1],
      "input",
    )
    const output = buildAutoroutingPhaseCircuitJson(
      recordedSensor.circuitJson as CircuitJson,
      phases[1],
      "output",
    )
    expect(
      input.filter((element) => element.type === "pcb_trace"),
    ).toHaveLength(6)
    expect(
      output.filter((element) => element.type === "pcb_trace"),
    ).toHaveLength(13)
    for (const trace of output.filter(
      (element) => element.type === "pcb_trace",
    )) {
      expect(pcb_trace.safeParse(trace).success).toBe(true)
    }
  })
})
