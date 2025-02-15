import { test, expect } from "bun:test"
import { createCircuitWebWorker } from "@tscircuit/eval"
import evalWebWorkerBlobUrl from "@tscircuit/eval/blob-url"

test("RunFrame should handle circuit evaluation", async () => {
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

test("RunFrame should handle errors in circuit code", async () => {
  const worker = await createCircuitWebWorker({
    webWorkerUrl: evalWebWorkerBlobUrl,
    verbose: true,
  })

  let error: Error | null = null
  try {
    await worker.executeWithFsMap({
      fsMap: {
        "main.tsx": `
          circuit.add(
            <board width="10mm" height="10mm">
            // missing resistance value
              <resistor name="R1" footprint="0402" />
            </board>
          )
        `,
      },
      entrypoint: "main.tsx",
    })
    await worker.renderUntilSettled()
  } catch (e) {
    error = e as Error
  }

  expect(error).toBeDefined()
  expect(error?.message).toContain("resistance")
})

test("RunFrame should handle empty fsMap", async () => {
  const worker = await createCircuitWebWorker({
    webWorkerUrl: evalWebWorkerBlobUrl,
    verbose: true,
  })

  let error: Error | null = null
  try {
    await worker.executeWithFsMap({
      fsMap: {},
      entrypoint: "main.tsx",
    })
    await worker.renderUntilSettled()
  } catch (e) {
    error = e as Error
  }

  expect(error).toBeDefined()
  expect(error?.message).toContain("No code found at entry point")
})

test("RunFrame should handle missing entrypoint", async () => {
  const worker = await createCircuitWebWorker({
    webWorkerUrl: evalWebWorkerBlobUrl,
    verbose: true,
  })

  let error: Error | null = null
  try {
    await worker.executeWithFsMap({
      fsMap: {
        "other.tsx": "// some code",
      },
      entrypoint: "main.tsx",
    })
    await worker.renderUntilSettled()
  } catch (e) {
    error = e as Error
  }

  expect(error).toBeDefined()
  expect(error?.message).toContain("No code found at entry point")
})
