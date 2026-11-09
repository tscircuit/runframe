import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test(
  "reference design switching ignores superseded loads and never evaluates source",
  () =>
    runIsolatedUiTest(
      new URL(
        "./fixtures/reference-design-viewer.scenario.tsx",
        import.meta.url,
      ),
    ),
  { timeout: 30000 },
)
