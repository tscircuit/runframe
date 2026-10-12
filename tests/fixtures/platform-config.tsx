import { expect, test } from "bun:test"
import type { PlatformConfig } from "@tscircuit/props"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import {
  fakeEvaluator,
  previewConfigs,
  cliConfigs,
} from "./fake-platform-services"

test("shared circuit hooks reach the evaluator and schematic viewer unchanged", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "http://localhost",
    pretendToBeVisual: true,
  })
  ;(dom.window as any).TSCIRCUIT_ALLOW_SELECTING_EVAL_VERSION = false
  ;(dom.window as any).TSCIRCUIT_TELEMETRY_DISABLED = true
  const globals = [
    "window",
    "document",
    "location",
    "Element",
    "HTMLElement",
    "Node",
    "Event",
    "MouseEvent",
    "MutationObserver",
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "ResizeObserver",
  ] as const
  const previous = Object.fromEntries(
    globals.map((key) => [key, (globalThis as any)[key]]),
  )
  const previousFetch = globalThis.fetch
  const previousWorker = globalThis.runFrameWorker
  const externalRequests: RequestInfo[] = []
  const fakeNetwork = async (input: RequestInfo) => {
    externalRequests.push(input)
    throw new Error("Pinned local runtime must not use global fetch")
  }
  Object.assign(
    globalThis,
    Object.fromEntries(globals.map((key) => [key, (dom.window as any)[key]])),
    {
      IS_REACT_ACT_ENVIRONMENT: true,
      runFrameWorker: undefined,
      ResizeObserver: class {
        observe() {}
        disconnect() {}
      },
      fetch: fakeNetwork,
    },
  )
  ;(dom.window as any).fetch = fakeNetwork
  let root = createRoot(document.getElementById("root")!)
  try {
    const { RunFrame } = await import("../../lib/components/RunFrame/RunFrame")
    const platformConfig: PlatformConfig = {
      projectBaseUrl: "http://localhost/project",
      enablePartOrientationAnalysis: false,
      partsEngine: { findPart: () => ({}) },
      platformFetch: fakeNetwork as typeof fetch,
    }
    await act(async () => {
      root.render(
        <RunFrame
          fsMap={{}}
          isLoadingFiles
          platformConfig={platformConfig}
          evalVersion="0.0.1580"
          evalWebWorkerBlobUrl="/assets/eval-worker.js"
          showFileMenu={false}
        />,
      )
    })
    expect(fakeEvaluator.workers).toHaveLength(1)
    const options = fakeEvaluator.workers[0]!.options as {
      platform: PlatformConfig
      projectConfig: Partial<PlatformConfig>
    }
    expect(options.platform).toBe(platformConfig)
    expect(options.projectConfig).toMatchObject({
      projectBaseUrl: platformConfig.projectBaseUrl,
      enablePartOrientationAnalysis: false,
    })
    expect(externalRequests).toHaveLength(0)

    await act(async () => root.unmount())
    root = createRoot(document.getElementById("root")!)
    await act(async () => {
      root.render(
        <RunFrame
          fsMap={{ "board.circuit.json": "[]" }}
          mainComponentPath="board.circuit.json"
          platformConfig={platformConfig}
          availableTabs={["schematic"]}
          defaultActiveTab="schematic"
          showFileMenu={false}
        />,
      )
    })
    expect(
      document.querySelector('[data-testid="schematic-viewer"]'),
    ).not.toBeNull()
    expect(previewConfigs.at(-1)).toBe(platformConfig)
    expect(fakeEvaluator.workers).toHaveLength(1)

    await act(async () => root.unmount())
    root = createRoot(document.getElementById("root")!)
    const { RunFrameForCli } = await import(
      "../../lib/components/RunFrameForCli/RunFrameForCli"
    )
    await act(async () =>
      root.render(
        <RunFrameForCli
          platformConfig={platformConfig}
          cachedDatasheetImports
          evalVersion="0.0.1595"
          evalWebWorkerBlobUrl="/assets/eval-worker.js"
        />,
      ),
    )
    expect(cliConfigs.at(-1)).toMatchObject({
      cachedDatasheetImports: true,
      evalVersion: "0.0.1595",
      evalWebWorkerBlobUrl: "/assets/eval-worker.js",
      forceLatestEvalVersion: false,
      shouldLoadLatestEval: false,
    })
    expect(cliConfigs.at(-1)?.platformConfig?.platformFetch).toBe(
      platformConfig.platformFetch,
    )
    expect(externalRequests).toHaveLength(0)
  } finally {
    await act(async () => root.unmount())
    globalThis.fetch = previousFetch
    Object.assign(globalThis, previous, {
      IS_REACT_ACT_ENVIRONMENT: false,
      runFrameWorker: previousWorker,
    })
    dom.window.close()
  }
})
