import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("RunFrame forwards the shared platform config to its worker and preview", async () => {
  await runIsolatedUiTest(
    new URL("./fixtures/platform-config.tsx", import.meta.url),
  )
}, 20000)
