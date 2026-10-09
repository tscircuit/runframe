import { expect, test } from "bun:test"
import {
  getCircuitPlatformConfig,
  type RunFramePlatformConfig,
} from "../lib/components/RunFrame/RunFramePlatformConfig"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("UI settings do not cross the worker boundary; circuit hooks retain identity", () => {
  const partsEngine = { findPart: () => ({}) }
  const platformFetch = fetch
  const config: RunFramePlatformConfig = {
    partsEngine,
    platformFetch,
    projectBaseUrl: "http://localhost/project",
    telemetryDisabled: true,
    evalCdnLoadingDisabled: true,
    evalVersionSelectionDisabled: true,
    pcbRenderer: "canvas",
  }
  expect(getCircuitPlatformConfig(undefined)).toBeUndefined()
  const circuit = getCircuitPlatformConfig(config)
  expect(circuit).toEqual({
    partsEngine,
    platformFetch,
    projectBaseUrl: config.projectBaseUrl,
  })
  expect(circuit?.partsEngine).toBe(partsEngine)
  expect(circuit?.platformFetch).toBe(platformFetch)
})

test("RunFrame and its preview consume one platform config", async () => {
  await runIsolatedUiTest(
    new URL("./fixtures/platform-config.fixture.tsx", import.meta.url),
  )
}, 20000)
