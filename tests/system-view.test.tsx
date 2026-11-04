import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("System view supports dropdown navigation and resolved multi-page diagrams", () =>
  runIsolatedUiTest(
    new URL("./fixtures/system-view.scenario.tsx", import.meta.url),
  ))
