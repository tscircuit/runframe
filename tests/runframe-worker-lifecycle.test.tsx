import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test(
  "RunFrame preserves its worker lifecycle across initialization and failures",
  () =>
    runIsolatedUiTest(
      new URL("./fixtures/runframe-worker-lifecycle.tsx", import.meta.url),
    ),
  { timeout: 30000 },
)
