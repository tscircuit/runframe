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

test("a nested extra-tab frame cannot reconfigure its parent RunFrame", () => {
  const parent = {} as Window
  const child = {} as Window
  const data = { runframe_props: { fsMap: { "index.tsx": "untrusted" } } }
  expect(
    isRunFramePropsMessageFromParent({ source: child, data }, parent),
  ).toBe(false)
  expect(isRunFramePropsMessageFromParent({ source: null, data }, parent)).toBe(
    false,
  )
  expect(
    isRunFramePropsMessageFromParent({ source: parent, data }, parent),
  ).toBe(true)
  for (const malformed of [
    null,
    "runframe_props",
    { runframe_props: null },
    { runframe_props: [] },
  ]) {
    expect(
      isRunFramePropsMessageFromParent(
        { source: parent, data: malformed },
        parent,
      ),
    ).toBe(false)
  }
})
