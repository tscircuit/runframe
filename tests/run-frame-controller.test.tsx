import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("useRunFrameController drives RunFrame and follows its runs", () =>
  runIsolatedUiTest(
    new URL("./fixtures/run-frame-controller.scenario.tsx", import.meta.url),
  ))
