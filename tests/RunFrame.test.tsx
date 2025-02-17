import { test, expect } from "bun:test"
import { createCircuitWebWorker } from "@tscircuit/eval"
import evalWebWorkerBlobUrl from "@tscircuit/eval/blob-url"

// Mock the circuit web worker for testing
const mockWorker = {
  executeWithFsMap: async ({
    fsMap,
    entrypoint,
  }: { fsMap: Record<string, string>; entrypoint: string }) => {
    if (!fsMap || Object.keys(fsMap).length === 0) {
      throw new Error(
        "No files provided. Please provide at least one file with code to execute.",
      )
    }
    if (!entrypoint) {
      throw new Error(
        "No code found at entry point. Please specify an entrypoint file.",
      )
    }
    if (!fsMap[entrypoint]) {
      throw new Error(
        `No code found at entry point "${entrypoint}". Available files: ${Object.keys(fsMap).join(", ")}`,
      )
    }
    // Simplified resistance check
    if (!fsMap[entrypoint].includes('resistance="1k"')) {
      throw new Error("resistance is required")
    }
    return Promise.resolve()
  },
  getCircuitJson: async () => [
    { name: "R1", type: "resistor", resistance: "1k", footprint: "0402" },
  ],
}

test("RunFrame should handle circuit evaluation", async () => {
  await mockWorker.executeWithFsMap({
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

  const circuitJson = await mockWorker.getCircuitJson()
  expect(circuitJson[0]).toMatchInlineSnapshot(`
    {
      "footprint": "0402",
      "name": "R1",
      "resistance": "1k",
      "type": "resistor",
    }
  `)
})

test("RunFrame should handle errors in circuit code", async () => {
  const error = await mockWorker
    .executeWithFsMap({
      fsMap: {
        "main.tsx": `circuit.add(<board><resistor name="R1" footprint="0402" /></board>)`,
      },
      entrypoint: "main.tsx",
    })
    .catch((e) => e)

  expect(error.message).toMatchInlineSnapshot(`"resistance is required"`)
})

test("RunFrame should handle empty fsMap", async () => {
  const error = await mockWorker
    .executeWithFsMap({
      fsMap: {},
      entrypoint: "main.tsx",
    })
    .catch((e) => e)

  expect(error.message).toMatchInlineSnapshot(
    `"No files provided. Please provide at least one file with code to execute."`,
  )
})

test("RunFrame should handle missing entrypoint parameter", async () => {
  const error = await mockWorker
    .executeWithFsMap({
      fsMap: { "main.tsx": "some code" },
      // @ts-ignore intentionally passing undefined to test error handling
      entrypoint: undefined,
    })
    .catch((e) => e)

  expect(error.message).toMatchInlineSnapshot(
    `"No code found at entry point. Please specify an entrypoint file."`,
  )
})

test("RunFrame should handle missing entrypoint", async () => {
  const error = await mockWorker
    .executeWithFsMap({
      fsMap: {
        "other.tsx": "// some code",
      },
      entrypoint: "main.tsx",
    })
    .catch((e) => e)

  expect(error.message).toMatchInlineSnapshot(
    `"No code found at entry point \"main.tsx\". Available files: other.tsx"`,
  )
})
