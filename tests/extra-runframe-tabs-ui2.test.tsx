import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("fallback respects available tab order on initial selection and external tab removal", () =>
  runIsolatedUiTest(
    new URL(
      "./fixtures/extra-runframe-tabs-order.scenario.tsx",
      import.meta.url,
    ),
  ))
