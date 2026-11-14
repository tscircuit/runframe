import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("a host page can hide the header and control the active tab", () =>
  runIsolatedUiTest(
    new URL("./fixtures/host-controlled-tabs.scenario.tsx", import.meta.url),
  ))
