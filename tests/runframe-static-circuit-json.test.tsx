import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test(
  "RunFrame handles static Circuit JSON without worker initialization",
  () =>
    runIsolatedUiTest(
      new URL("./fixtures/runframe-static-circuit-json.tsx", import.meta.url),
    ),
  { timeout: 30000 },
)
