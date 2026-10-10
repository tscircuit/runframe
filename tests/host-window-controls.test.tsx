import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("host window controls preserve telemetry and version selector defaults", async () => {
  await runIsolatedUiTest(
    new URL("./fixtures/host-window-controls.tsx", import.meta.url),
  )
})
