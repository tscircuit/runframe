import { expect, test } from "bun:test"
import {
  getRunFrameIframeTargetOrigin,
  isRunFrameReadyMessageFromIframe,
} from "../lib/components/RunFrameWithIframe/RunFrameWithIframe"

test("getRunFrameIframeTargetOrigin resolves absolute and relative iframe urls", () => {
  expect(
    getRunFrameIframeTargetOrigin(
      "https://runframe.tscircuit.com/iframe.html",
      "https://example.com/embed",
    ),
  ).toBe("https://runframe.tscircuit.com")

  expect(
    getRunFrameIframeTargetOrigin("/iframe.html", "https://example.com/embed"),
  ).toBe("https://example.com")
})

test("getRunFrameIframeTargetOrigin falls back for opaque iframe origins", () => {
  expect(
    getRunFrameIframeTargetOrigin("about:blank", "https://example.com/embed"),
  ).toBe("*")
})

test("isRunFrameReadyMessageFromIframe rejects unexpected sources and origins", () => {
  const iframeWindow = {} as Window
  const otherWindow = {} as Window
  const targetOrigin = "https://runframe.tscircuit.com"

  expect(
    isRunFrameReadyMessageFromIframe(
      {
        data: { runframe_type: "runframe_ready_to_receive" },
        origin: targetOrigin,
        source: iframeWindow,
      },
      iframeWindow,
      targetOrigin,
    ),
  ).toBe(true)

  expect(
    isRunFrameReadyMessageFromIframe(
      {
        data: { runframe_type: "runframe_ready_to_receive" },
        origin: targetOrigin,
        source: otherWindow,
      },
      iframeWindow,
      targetOrigin,
    ),
  ).toBe(false)

  expect(
    isRunFrameReadyMessageFromIframe(
      {
        data: { runframe_type: "runframe_ready_to_receive" },
        origin: "https://attacker.example",
        source: iframeWindow,
      },
      iframeWindow,
      targetOrigin,
    ),
  ).toBe(false)
})
