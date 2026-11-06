import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test(
  "Drawing package integration, navigation, errors and reruns",
  () =>
    runIsolatedUiTest(
      new URL("./fixtures/drawing.scenario.tsx", import.meta.url),
    ),
  25000,
)
