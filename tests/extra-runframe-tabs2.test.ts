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
