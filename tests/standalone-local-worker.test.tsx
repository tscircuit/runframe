import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test(
  "standalone forwards its local worker URL and fixed eval version",
  () =>
    runIsolatedUiTest(
      new URL("./fixtures/standalone-local-worker.tsx", import.meta.url),
    ),
  { timeout: 30000 },
)
