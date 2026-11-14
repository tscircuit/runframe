import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("ngspice inputs isolate circuits and preserve repeated device labels", async () => {
  await runIsolatedUiTest(
    new URL("./fixtures/spice-netlist.tsx", import.meta.url),
  )
}, 20000)

test("ngspice requests serialize and recover after a failed run", async () => {
  await runIsolatedUiTest(
    new URL("./fixtures/spice-engine.ts", import.meta.url),
  )
}, 20000)
