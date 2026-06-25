import { describe, expect, test } from "bun:test"

import {
  getUpdatedHashForFileSelection,
  getUrlSelectedFileFromLocation,
} from "../lib/components/RunFrameStaticBuildViewer/url-selection"

describe("RunFrameStaticBuildViewer URL selection", () => {
  test("prefers hash file over stale query file", () => {
    expect(
      getUrlSelectedFileFromLocation("?file=old.tsx", "#file=new.tsx"),
    ).toBe("new.tsx")
  })

  test("falls back to main_component in hash", () => {
    expect(
      getUrlSelectedFileFromLocation(
        "",
        "#main_component=lib%2Fsubcircuits%2FBQ24074-subcircuit.circuit.tsx",
      ),
    ).toBe("lib/subcircuits/BQ24074-subcircuit.circuit.tsx")
  })

  test("falls back to query params when hash has no file selection", () => {
    expect(
      getUrlSelectedFileFromLocation(
        "?main_component=lib%2Fmain.circuit.tsx",
        "",
      ),
    ).toBe("lib/main.circuit.tsx")
  })

  test("updates both file and main_component when main_component exists", () => {
    expect(
      getUpdatedHashForFileSelection(
        "#file=old.tsx&main_component=old.tsx",
        "new.tsx",
      ),
    ).toBe("#file=new.tsx&main_component=new.tsx")
  })

  test("does not rewrite hash when file selection is already current", () => {
    expect(
      getUpdatedHashForFileSelection(
        "#file=current.tsx&main_component=current.tsx",
        "current.tsx",
      ),
    ).toBeNull()
  })
})
