import { test, expect } from "bun:test"
import { createCircuitWebWorker } from "../lib/utils/createCircuitWebWorker"
import evalWebWorkerBlobUrl from "@tscircuit/eval/blob-url"
import type { PcbComponent } from "circuit-json"

test("CircuitWebWorker should handle circuit evaluation", async () => {
  const worker = await createCircuitWebWorker({
    webWorkerUrl: evalWebWorkerBlobUrl,
    verbose: true,
  })

  await worker.executeWithFsMap({
    fsMap: {
      "main.tsx": `
        circuit.add(
          <board width="10mm" height="10mm">
            <resistor name="R1" resistance="1k" footprint="0402" />
          </board>
        )
      `,
    },
    entrypoint: "main.tsx",
  })

  await worker.renderUntilSettled()
  const circuitJson = await worker.getCircuitJson()

  expect(circuitJson).toBeDefined()
  const resistor = circuitJson.find((el: any) => el.name === "R1")
  expect(resistor).toBeDefined()
})
