import { describe, expect, test } from "bun:test"
import { getErrorNameFromStack } from "../lib/hooks/use-error-telemetry"

describe("getErrorNameFromStack", () => {
  test("recovers the real error type from a V8 stack", () => {
    const stack =
      "ReferenceError: index is not defined\n    at Board (blob:http://localhost:3020/abc:1:1)"
    expect(getErrorNameFromStack(stack)).toBe("ReferenceError")
  })

  test("recovers other built-in error types", () => {
    expect(
      getErrorNameFromStack("TypeError: x is not a function\n    at y"),
    ).toBe("TypeError")
    expect(getErrorNameFromStack("SyntaxError: bad token\n    at z")).toBe(
      "SyntaxError",
    )
  })

  test("returns null when the type cannot be read", () => {
    expect(getErrorNameFromStack("Error: no files provided")).toBeNull()
    expect(getErrorNameFromStack("y@http://localhost/main.js:1:1")).toBeNull()
    expect(getErrorNameFromStack(null)).toBeNull()
    expect(getErrorNameFromStack("")).toBeNull()
  })
})
