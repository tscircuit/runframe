import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("assembly BOM interactions and stale-request handling", () =>
  runIsolatedUiTest(
    new URL("./fixtures/bom-table.scenario.tsx", import.meta.url),
  ))
