import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("solver selection updates the debugger without hiding solver errors", () =>
  runIsolatedUiTest(
    new URL("./fixtures/solvers-tab-switching.scenario.tsx", import.meta.url),
  ))
