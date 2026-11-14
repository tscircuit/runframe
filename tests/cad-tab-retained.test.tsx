import { test } from "bun:test"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("the 3D view stays mounted while another view is selected", () =>
  runIsolatedUiTest(
    new URL("./fixtures/cad-tab-retained.scenario.tsx", import.meta.url),
  ))
