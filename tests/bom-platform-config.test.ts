import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("BOM previews use their own platform config", async () => {
  await runIsolatedUiTest(
    new URL("./fixtures/bom-platform-config.tsx", import.meta.url),
  )
}, 20000)
