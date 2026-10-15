import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"

const rendered = mock((_props: any) => <div />)
mock.module("lib/components/RunFrameWithApi/RunFrameWithApi", () => ({
  RunFrameWithApi: rendered,
  guessEntrypoint: () => undefined,
}))
mock.module("posthog-js", () => ({
  default: {
    init: () => {},
    capture: () => {},
    identify: () => {},
    captureException: () => {},
  },
}))

test("standalone passes the supplied worker configuration through RunFrameForCli", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "http://localhost",
    pretendToBeVisual: true,
  })
  const globals = [
    "window",
    "document",
    "location",
    "Element",
    "HTMLElement",
    "Node",
    "Event",
    "MutationObserver",
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
  ] as const
  const previous = Object.fromEntries(
    globals.map((key) => [key, (globalThis as any)[key]]),
  )
  const previousFetch = globalThis.fetch
  const fetchMock = mock(() => {
    throw new Error("Local worker configuration must not discover versions")
  })
  Object.assign(dom.window, {
    TSCIRCUIT_USE_RUNFRAME_FOR_CLI: true,
    TSCIRCUIT_TELEMETRY_DISABLED: true,
    TSCIRCUIT_EVAL_WORKER_URL:
      "/jscdn/@tscircuit/eval/0.0.1619/dist/webworker/entrypoint.js",
    TSCIRCUIT_EVAL_VERSION: "0.0.1619",
  })
  Object.assign(
    globalThis,
    Object.fromEntries(globals.map((key) => [key, (dom.window as any)[key]])),
    { IS_REACT_ACT_ENVIRONMENT: true },
  )
  globalThis.fetch = fetchMock as unknown as typeof fetch
  try {
    await act(async () => {
      await import("../../lib/components/RunFrameWithApi/standalone")
      document.dispatchEvent(new dom.window.Event("DOMContentLoaded"))
      await Bun.sleep(10)
    })
    expect(rendered).toHaveBeenCalled()
    expect(rendered.mock.calls.at(-1)?.[0]).toMatchObject({
      evalWebWorkerBlobUrl: window.TSCIRCUIT_EVAL_WORKER_URL,
      evalVersion: "0.0.1619",
      forceLatestEvalVersion: false,
      shouldLoadLatestEval: false,
    })
    expect(fetchMock).not.toHaveBeenCalled()
  } finally {
    globalThis.fetch = previousFetch
    Object.assign(globalThis, previous)
    dom.window.close()
  }
})
