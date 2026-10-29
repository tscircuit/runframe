import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("render status details stay readable and update live", () =>
  runIsolatedUiTest(
    new URL("./fixtures/render-status.scenario.tsx", import.meta.url),
  ))
