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
