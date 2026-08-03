import { expect, test } from "bun:test"
import type { PartsEngine, PlatformConfig } from "@tscircuit/props"
import { getRunFrameProjectConfig } from "lib/components/RunFrame/get-run-frame-project-config"

test("RunFrame enables part orientation analysis while preserving platform overrides", () => {
  const partsEngine = {
    findPart: () => ({ jlcpcb: ["C123"] }),
  } satisfies PartsEngine
  const platformConfig = {
    partsEngine,
    enablePartOrientationAnalysis: false,
  } satisfies PlatformConfig

  expect(
    getRunFrameProjectConfig({
      platformConfig,
      projectBaseUrl: "https://example.com/files",
    }),
  ).toMatchObject({
    partsEngine,
    projectBaseUrl: "https://example.com/files",
    enablePartOrientationAnalysis: true,
  })
})
