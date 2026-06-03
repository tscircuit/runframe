import { expect, test } from "bun:test"
import { createCircuitWebWorker } from "@tscircuit/eval"
import evalWebWorkerBlobUrl from "@tscircuit/eval/blob-url"

test(
  "tscircuit.config.ts platformConfig is loaded before the entrypoint",
  async () => {
    const worker = await createCircuitWebWorker({
      webWorkerUrl: evalWebWorkerBlobUrl,
      verbose: true,
      platform: {
        projectName: "received-platform-config",
      },
    })

    await worker.executeWithFsMap({
      fsMap: {
        "main.tsx": `
          const platform = globalThis.__tscircuit_circuit.platform
          if (platform.projectName !== "executable-config") {
            throw new Error("Expected executable config platform before entrypoint, got " + platform.projectName)
          }

          circuit.add(
            <board width="10mm" height="10mm">
              <resistor name="R1" resistance="1k" footprint="0402" />
            </board>
          )
        `,
        "tscircuit.config.ts": `
          export default {
            platformConfig: {
              projectName: "executable-config"
            }
          }
        `,
      },
      entrypoint: "main.tsx",
    })

    await worker.renderUntilSettled()
    const circuitJson = await worker.getCircuitJson()

    expect(circuitJson.find((el: any) => el.name === "R1")).toBeDefined()
  },
  { timeout: 120000 },
)
