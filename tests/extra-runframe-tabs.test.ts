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

test("only valid HTTP(S) views survive bootstrap validation", () => {
  const invalid = [
    null,
    {},
    { tabName: "", iframeUrl: "https://example.com" },
    { tabName: "   ", iframeUrl: "https://example.com" },
    { tabName: "bad", iframeUrl: "/relative" },
    { tabName: "bad", iframeUrl: "javascript:alert(1)" },
    { tabName: "bad", iframeUrl: "data:text/html,<script>" },
    { tabName: "bad", iframeUrl: "https://user:pass@example.com" },
    { tabName: "\ud800", iframeUrl: "https://example.com" },
  ]
  expect(resolveExtraRunFrameTabs(invalid)).toEqual([])
  expect(resolveExtraRunFrameTabs({})).toEqual([])
  expect(
    resolveExtraRunFrameTabs([
      ...invalid,
      {
        tabName: " Sysconfig ",
        iframeUrl:
          "https://viewer.example/#data:application/gzip;base64,a+b/c=",
      },
      { tabName: "Sysconfig", iframeUrl: "https://duplicate.example/" },
      { tabName: "pcb", iframeUrl: "http://localhost:5187/" },
    ]),
  ).toEqual([
    {
      tabName: "Sysconfig",
      iframeUrl: "https://viewer.example/#data:application/gzip;base64,a+b/c=",
      id: "extra:Sysconfig",
    },
    { tabName: "pcb", iframeUrl: "http://localhost:5187/", id: "extra:pcb" },
  ])
})

test("scoping happens before duplicate names are resolved", () => {
  const tabs: ExtraRunFrameTab[] = [
    { tabName: "Docs", iframeUrl: "https://docs.example/" },
    {
      tabName: "Sysconfig",
      iframeUrl: "https://viewer.example/#a",
      mainComponentPath: "./boards/a.tsx",
    },
    {
      tabName: "Sysconfig",
      iframeUrl: "https://viewer.example/#b",
      mainComponentPath: "boards\\b.tsx",
    },
  ]
  const first = resolveExtraRunFrameTabs(
    filterExtraRunFrameTabs(tabs, "boards/a.tsx"),
  )
  const second = resolveExtraRunFrameTabs(
    filterExtraRunFrameTabs(tabs, "./boards/b.tsx"),
  )
  expect(first.map((t) => t.iframeUrl)).toEqual([
    "https://docs.example/",
    "https://viewer.example/#a",
  ])
  expect(second.map((t) => t.iframeUrl)).toEqual([
    "https://docs.example/",
    "https://viewer.example/#b",
  ])
  expect(filterExtraRunFrameTabs(tabs, "no-config.tsx")).toEqual([tabs[0]!])
  expect(filterExtraRunFrameTabs(tabs, undefined)).toEqual([tabs[0]!])
  expect(filterExtraRunFrameTabs(undefined, undefined)).toEqual([])
})

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

test("outer iframe readiness requires the exact child and origin", () => {
  const child = {} as Window
  const data = { runframe_type: "runframe_ready_to_receive" }
  const message = { data, source: child, origin: "https://runframe.example" }
  expect(isRunFrameReadyMessageFromChild(message, child, message.origin)).toBe(
    true,
  )
  expect(
    isRunFrameReadyMessageFromChild(
      { ...message, source: {} as Window },
      child,
      message.origin,
    ),
  ).toBe(false)
  expect(
    isRunFrameReadyMessageFromChild(
      { ...message, origin: "https://other.example" },
      child,
      message.origin,
    ),
  ).toBe(false)
  expect(
    isRunFrameReadyMessageFromChild(
      { ...message, source: null },
      null,
      message.origin,
    ),
  ).toBe(false)
})
