import { describe, expect, test } from "bun:test"
import { resolveIframeTargetOrigin } from "../lib/utils/resolve-iframe-target-origin"

describe("resolveIframeTargetOrigin", () => {
  test("returns the origin of an absolute iframe url", () => {
    expect(
      resolveIframeTargetOrigin("https://runframe.tscircuit.com/iframe.html"),
    ).toBe("https://runframe.tscircuit.com")
  })

  test("strips path, query and hash, keeping only the origin", () => {
    expect(
      resolveIframeTargetOrigin("https://example.com:8080/a/b?c=1#d"),
    ).toBe("https://example.com:8080")
  })

  test("resolves a relative url against the base url", () => {
    expect(
      resolveIframeTargetOrigin("/iframe.html", "https://app.tscircuit.com/x"),
    ).toBe("https://app.tscircuit.com")
  })

  test("returns null for an unparseable url", () => {
    expect(resolveIframeTargetOrigin("not a url")).toBeNull()
  })

  test("never returns the wildcard origin", () => {
    expect(
      resolveIframeTargetOrigin("https://runframe.tscircuit.com/iframe.html"),
    ).not.toBe("*")
  })
})
