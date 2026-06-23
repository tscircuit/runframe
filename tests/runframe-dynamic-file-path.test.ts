import { describe, expect, test } from "bun:test"

import { isDynamicFilePath } from "../lib/components/RunFrameWithApi/isDynamicFilePath"

describe("isDynamicFilePath", () => {
  test("treats executable ESM files as dynamic content", () => {
    expect(isDynamicFilePath("node_modules/circuit-json/dist/index.mjs")).toBe(
      true,
    )
  })

  test("treats executable CommonJS (.cjs) files as dynamic content", () => {
    expect(isDynamicFilePath("node_modules/jscad-planner/dist/index.cjs")).toBe(
      true,
    )
  })

  test("keeps static model assets as static assets", () => {
    expect(isDynamicFilePath("models/connector.step")).toBe(false)
    expect(isDynamicFilePath("models/board.glb")).toBe(false)
  })
})
