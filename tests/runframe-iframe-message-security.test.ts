import { expect, test } from "bun:test"
import {
  getIframeTargetOrigin,
  shouldSendRunFramePropsToIframe,
} from "../lib/components/RunFrameWithIframe/RunFrameWithIframe"

const createMessageEvent = (overrides: Partial<MessageEvent>): MessageEvent =>
  ({
    data: { runframe_type: "runframe_ready_to_receive" },
    origin: "https://runframe.tscircuit.com",
    source: {} as WindowProxy,
    ...overrides,
  }) as MessageEvent

test("iframe postMessage guard requires expected source and origin", () => {
  const iframeWindow = {} as WindowProxy
  const targetOrigin = "https://runframe.tscircuit.com"

  expect(
    shouldSendRunFramePropsToIframe({
      event: createMessageEvent({ source: iframeWindow }),
      iframeWindow,
      targetOrigin,
    }),
  ).toBe(true)

  expect(
    shouldSendRunFramePropsToIframe({
      event: createMessageEvent({ source: {} as WindowProxy }),
      iframeWindow,
      targetOrigin,
    }),
  ).toBe(false)

  expect(
    shouldSendRunFramePropsToIframe({
      event: createMessageEvent({
        origin: "https://attacker.example",
        source: iframeWindow,
      }),
      iframeWindow,
      targetOrigin,
    }),
  ).toBe(false)

  expect(
    shouldSendRunFramePropsToIframe({
      event: createMessageEvent({
        data: { runframe_type: "not_ready" },
        source: iframeWindow,
      }),
      iframeWindow,
      targetOrigin,
    }),
  ).toBe(false)
})

test("iframe target origin is derived from absolute and relative iframe URLs", () => {
  expect(
    getIframeTargetOrigin("https://runframe.tscircuit.com/iframe.html"),
  ).toBe("https://runframe.tscircuit.com")
  expect(
    getIframeTargetOrigin("/iframe.html", "https://app.example/view"),
  ).toBe("https://app.example")
  expect(getIframeTargetOrigin("http://[::1", "https://app.example/view")).toBe(
    null,
  )
})
