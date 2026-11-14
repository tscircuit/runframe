import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("RunFrameInIframe is driven by messages from its parent window", () =>
  runIsolatedUiTest(
    new URL("./fixtures/run-frame-in-iframe.scenario.tsx", import.meta.url),
  ))
