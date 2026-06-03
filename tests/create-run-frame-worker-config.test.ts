import { describe, expect, test } from "bun:test"
import type { PlatformConfig } from "@tscircuit/props"

import {
  createRunFrameWorkerConfig,
  getRunFrameWorkerConfigCacheKey,
} from "../lib/components/RunFrame/create-run-frame-worker-config"
import type { RunFrameProps } from "../lib/components/RunFrame/RunFrameProps"

const createProps = (overrides: Partial<RunFrameProps> = {}): RunFrameProps =>
  ({
    fsMap: {},
    ...overrides,
  }) as RunFrameProps

describe("createRunFrameWorkerConfig", () => {
  test("forwards received platformConfig using eval's platform option", () => {
    const platformConfig: PlatformConfig = {
      partsEngineDisabled: true,
    }

    const config = createRunFrameWorkerConfig(
      createProps({
        platformConfig,
        projectBaseUrl: "https://example.com/project",
      }),
      { evalVersion: "0.0.887" },
    )

    expect(config.platform).toBe(platformConfig)
    expect("platformConfig" in config).toBe(false)
    expect(config.projectConfig).toEqual({
      projectBaseUrl: "https://example.com/project",
    })
  })

  test("changes cache key when received platformConfig changes", () => {
    const firstKey = getRunFrameWorkerConfigCacheKey(
      createProps({ platformConfig: { partsEngineDisabled: true } }),
      { evalVersion: "0.0.887" },
    )
    const secondKey = getRunFrameWorkerConfigCacheKey(
      createProps({ platformConfig: { routingDisabled: true } }),
      { evalVersion: "0.0.887" },
    )

    expect(firstKey).not.toBe(secondKey)
  })
})
