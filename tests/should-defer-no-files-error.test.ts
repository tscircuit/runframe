import { describe, expect, test } from "bun:test"

import { shouldDeferNoFilesError } from "../lib/components/RunFrame/should-defer-no-files-error"

describe("shouldDeferNoFilesError", () => {
  test("defers when an entrypoint is expected", () => {
    expect(shouldDeferNoFilesError({ entrypoint: "index.circuit.tsx" })).toBe(
      true,
    )
  })

  test("defers when a main component is expected", () => {
    expect(
      shouldDeferNoFilesError({ mainComponentPath: "index.circuit.tsx" }),
    ).toBe(true)
  })

  test("does not defer when no file is expected", () => {
    expect(shouldDeferNoFilesError({})).toBe(false)
    expect(
      shouldDeferNoFilesError({ entrypoint: "", mainComponentPath: "" }),
    ).toBe(false)
    expect(
      shouldDeferNoFilesError({
        entrypoint: undefined,
        mainComponentPath: null,
      }),
    ).toBe(false)
  })
})
