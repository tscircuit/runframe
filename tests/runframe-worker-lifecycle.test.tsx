import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test(
  "RunFrame preserves its worker lifecycle across initialization, failures and static files",
  () =>
    runIsolatedUiTest(
      new URL(
        "./fixtures/runframe-worker-lifecycle.fixture.tsx",
        import.meta.url,
      ),
    ),
  { timeout: 30000 },
)
