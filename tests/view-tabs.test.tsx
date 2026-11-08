import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("view tabs reflect circuit content and available space", () =>
  runIsolatedUiTest(
    new URL("./fixtures/view-tabs.scenario.tsx", import.meta.url),
  ))
