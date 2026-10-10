import { expect, test } from "bun:test"
import evalWebWorkerBlobUrl from "@tscircuit/eval/blob-url"
import { createCircuitWebWorker } from "@tscircuit/eval/worker"
import { jscadToStep } from "jscad-to-step"
import { getAssemblyJscad } from "../lib/optional-features/exporting/get-assembly-jscad"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("assembly STEP export and download", async () => {
  await runIsolatedUiTest(
    new URL("./fixtures/export-assembly-step.ts", import.meta.url),
  )
}, 30_000)

test("assembly STEP exports printed geometry produced by the circuit worker", async () => {
  const worker = await createCircuitWebWorker({
    webWorkerUrl: evalWebWorkerBlobUrl,
  })
  try {
    await worker.executeWithFsMap({
      fsMap: {
        "main.tsx": `
          import { assembly, jscad } from "tscircuit"
          export default () => (
            <assembly.device>
              <assembly.printedpart
                name="SPACER"
                jscad={<jscad.cuboid size={[12, 10, 4]} />}
              />
            </assembly.device>
          )
        `,
      },
      mainComponentPath: "main.tsx",
    })
    await worker.renderUntilSettled()
    const circuitJson = await worker.getCircuitJson()
    expect(circuitJson.some((element) => element.type === "pcb_board")).toBe(
      false,
    )
    expect(jscadToStep(getAssemblyJscad(circuitJson))).toContain(
      "MANIFOLD_SOLID_BREP",
    )
  } finally {
    await worker.kill()
  }
}, 30_000)
