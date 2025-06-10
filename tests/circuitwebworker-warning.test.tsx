import { test, expect } from "bun:test";
import { createCircuitWebWorker } from "@tscircuit/eval";
import evalWebWorkerBlobUrl from "@tscircuit/eval/blob-url";

const manualEdits = {
  pcb_placements: [
    {
      selector: "C1",
      center: {
        x: -1.451612903225806,
        y: 2.623655913978494,
      },
      relative_to: "group_center",
    },
  ],
};

test("CircuitWebWorker should include warnings", async () => {
  const worker = await createCircuitWebWorker({
    webWorkerUrl: evalWebWorkerBlobUrl,
    verbose: true,
  });

  await worker.executeWithFsMap({
    fsMap: {
      "main.tsx": `
        const manualEdits = ${JSON.stringify(manualEdits, null, 2)}
        circuit.add(
          <board width="10mm" height="10mm" manualEdits={manualEdits}>
            <resistor resistance="1k" footprint="0402" name="R1" schX={3} pcbX={3} />
            <capacitor
              capacitance="1000pF"
              footprint="0402"
              name="C1"
              schX={-3}
              pcbX={-3}
            />
            <trace from=".R1 > .pin1" to=".C1 > .pin1" />
          </board>
        )
      `,
    },
    entrypoint: "main.tsx",
  });

  await worker.renderUntilSettled();
  const circuitJson = await worker.getCircuitJson();

  const warning = circuitJson.find(
    (el: any) => el.type === "pcb_manual_edit_conflict_warning",
  );

  expect(warning).toBeDefined();
});
