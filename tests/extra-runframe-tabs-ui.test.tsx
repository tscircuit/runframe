import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("extra iframe tabs retain navigation, reconcile selection and accept live bootstrap updates", () =>
  runIsolatedUiTest(
    new URL("./fixtures/extra-runframe-tabs.scenario.tsx", import.meta.url),
  ))
