import { expect, test } from "bun:test"
import {
  filterExtraRunFrameTabs,
  resolveExtraRunFrameTabs,
  type ExtraRunFrameTab,
} from "../lib/components/CircuitJsonPreview/extra-runframe-tabs"
import {
  isRunFramePropsMessageFromParent,
  isRunFrameReadyMessageFromChild,
} from "../lib/components/RunFrameWithIframe/iframe-message-source"

test("outer iframe readiness requires the exact child and origin", () => {
  const child = {} as Window
  const data = { runframe_type: "runframe_ready_to_receive" }
  const message = { data, source: child, origin: "https://runframe.example" }
  expect(
    isRunFrameReadyMessageFromChild({
      event: message,
      child,
      origin: message.origin,
    }),
  ).toBe(true)
  expect(
    isRunFrameReadyMessageFromChild({
      event: { ...message, source: {} as Window },
      child,
      origin: message.origin,
    }),
  ).toBe(false)
  expect(
    isRunFrameReadyMessageFromChild({
      event: { ...message, origin: "https://other.example" },
      child,
      origin: message.origin,
    }),
  ).toBe(false)
  expect(
    isRunFrameReadyMessageFromChild({
      event: { ...message, source: null },
      child: null,
      origin: message.origin,
    }),
  ).toBe(false)
})
