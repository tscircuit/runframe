import { test, expect } from "bun:test"
import { createCircuitWebWorker } from "@tscircuit/eval"
import evalWebWorkerBlobUrl from "@tscircuit/eval/blob-url"
import type { PcbComponent } from "circuit-json"

test("CircuitWebWorker should handle manual edits", async () => {
  const worker = await createCircuitWebWorker({
    webWorkerUrl: evalWebWorkerBlobUrl,
    verbose: true,
  })

  await worker.executeWithFsMap({
    fsMap: {
      "entrypoint.tsx": `
        import manualEdits from "./manual-edits.json"
        circuit.add(<board width="20mm" height="20mm" manualEdits={manualEdits}><resistor name="R1" resistance="10k" footprint="0402" /></board>)
      `,
      "manual-edits.json": `
        {
          "pcb_placements": [
            {
              "selector": "R1",
              "center": {
                "x": 5,
                "y": 5
              },
              "relative_to": "group_center"
            }
          ],
          "edit_events": [],
          "manual_trace_hints": []
        }
      `,
    },
    entrypoint: "entrypoint.tsx",
  })

  await worker.renderUntilSettled()
  const circuitJson = await worker.getCircuitJson()
  expect(circuitJson).toBeDefined()
  const pcb_component = circuitJson.find(
    (el: any) => el.type === "pcb_component",
  ) as PcbComponent
  expect(pcb_component).toBeDefined()

  expect(pcb_component.center.x).toBe(5)
  expect(pcb_component.center.y).toBe(5)
})
