import { describe, expect, test } from "bun:test"

import { getFilePickerDisplayName } from "../lib/components/RunFrameWithApi/EnhancedFileSelectorCombobox/getFilePickerDisplayName"

describe("getFilePickerDisplayName", () => {
  test("displays .py.tsx files as .py", () => {
    expect(getFilePickerDisplayName("examples/hello.py.tsx")).toBe("hello.py")
  })

  test("leaves other file extensions unchanged", () => {
    expect(getFilePickerDisplayName("examples/hello.tsx")).toBe("hello.tsx")
    expect(getFilePickerDisplayName("examples/hello.py")).toBe("hello.py")
  })
})
