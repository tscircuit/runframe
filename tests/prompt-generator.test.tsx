import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("prompt generator handoff, attachments, edits and cancellation", async () => {
  await runIsolatedUiTest(
    new URL("./fixtures/prompt-generator.scenario.tsx", import.meta.url),
  )
}, 20000)
