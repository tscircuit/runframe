import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test(
  "file selector remains usable with a long path and keyboard shortcuts",
  () =>
    runIsolatedUiTest(
      new URL(
        "./fixtures/responsive-file-selector.scenario.tsx",
        import.meta.url,
      ),
    ),
  30000,
)
