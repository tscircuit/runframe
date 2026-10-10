import { expect, test } from "bun:test"
import { getRunFrameProjectConfig } from "lib/components/RunFrame/get-run-frame-project-config"

test("RunFrame enables part orientation analysis in its project config", () => {
  expect(
    getRunFrameProjectConfig({
      projectBaseUrl: "https://example.com/files",
    }),
  ).toMatchObject({
    projectBaseUrl: "https://example.com/files",
    enablePartOrientationAnalysis: true,
  })
})

test("RunFrame preserves an explicit platform choice to disable orientation analysis", () => {
  expect(
    getRunFrameProjectConfig({
      projectBaseUrl: "https://example.com/files",
      enablePartOrientationAnalysis: false,
    }),
  ).toMatchObject({
    enablePartOrientationAnalysis: false,
  })
})
