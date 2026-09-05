import { expect, test } from "bun:test"
import evalWebWorkerBlobUrl from "@tscircuit/eval/blob-url"
import { createCircuitWebWorker } from "@tscircuit/eval/worker"
import type { CircuitJson } from "circuit-json"
import {
  buildAutoroutingPhaseCircuitJson,
  captureAutoroutingPhase,
  type AutoroutingPhase,
  type AutoroutingPhaseEvent,
} from "../lib/autorouting"

// Compare actual copper geometry independently of renderer-only snapshot IDs.
const getTraceGeometry = (circuitJson: CircuitJson) =>
  circuitJson
    .filter((element) => element.type === "pcb_trace")
    .map((trace) => {
      const points = trace.route.map((point) =>
        point.route_type === "wire"
          ? {
              type: "wire",
              x: point.x,
              y: point.y,
              layer: point.layer,
              width: point.width,
            }
          : point.route_type === "via"
            ? {
                type: "via",
                x: point.x,
                y: point.y,
                layers: [point.from_layer, point.to_layer].sort(),
              }
            : point,
      )
      // Core can reverse a route when assigning its final source connection.
      // Direction does not change its copper geometry.
      return [
        JSON.stringify(points),
        JSON.stringify(points.toReversed()),
      ].sort()[0]
    })
    .sort()

test(
  "captures real fanout and global routing through a reused worker without retaining old listeners",
  async () => {
    const sensorSource = await Bun.file(
      new URL("../examples/assets/autorouting-sensor.tsx", import.meta.url),
    ).text()
    const worker = await createCircuitWebWorker({
      webWorkerBlobUrl: evalWebWorkerBlobUrl,
      platform: { placementDrcChecksDisabled: true },
      disableCdnLoading: true,
    })
    const runEvents: AutoroutingPhaseEvent[][] = []

    try {
      for (let run = 0; run < 2; run++) {
        // RunFrame reuses this worker and replaces the full per-run listener set.
        await worker.clearEventListeners()
        const events: AutoroutingPhaseEvent[] = []
        runEvents.push(events)
        let phases: AutoroutingPhase[] = []
        for (const type of [
          "autorouting:start",
          "autorouting:end",
          "autorouting:error",
        ] as const) {
          worker.on(type, (event) => {
            // The worker channel is authoritative: older core payloads omit type.
            const snapshot = { ...structuredClone(event), type }
            events.push(snapshot)
            phases = captureAutoroutingPhase(phases, snapshot)
          })
        }

        await worker.executeWithFsMap({
          fsMap: { "main.tsx": sensorSource },
          mainComponentPath: "main.tsx",
        })
        await worker.renderUntilSettled()
        const circuitJson = await worker.getCircuitJson()

        expect(events.map((event) => event.type)).toEqual([
          "autorouting:start",
          "autorouting:end",
          "autorouting:start",
          "autorouting:end",
        ])
        expect(phases).toHaveLength(2)
        for (const phase of phases) {
          expect(phase.status).toBe("complete")
          expect(phase.startSimpleRouteJson).toBeDefined()
          expect(phase.endSimpleRouteJson?.traces?.length).toBeGreaterThan(0)
        }
        expect(phases[1].phaseName).toBe("Global routing")
        expect(phases[1].startSimpleRouteJson?.traces).toHaveLength(6)
        expect(
          circuitJson.filter((element) => element.type === "pcb_component"),
        ).toHaveLength(5)
        expect(
          circuitJson.find((element) => element.type === "pcb_board"),
        ).toMatchObject({ width: 20, height: 16 })

        const output = buildAutoroutingPhaseCircuitJson(
          circuitJson,
          phases[1],
          "output",
        )
        expect(getTraceGeometry(output)).toHaveLength(13)
        expect(getTraceGeometry(output)).toEqual(getTraceGeometry(circuitJson))
        // If the first subscription survived clearEventListeners, rerun 2 would
        // append another four events to its array even with a fresh phases list.
        expect(runEvents[0]).toHaveLength(4)
      }
    } finally {
      await worker.kill()
    }
  },
  { timeout: 120000 },
)
