import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { usePcbViewerController } from "@tscircuit/pcb-viewer"

const createWorker = mock(async (_options: unknown) => ({}))
const initTelemetry = mock(() => {})
mock.module("@tscircuit/eval/worker", () => ({
  createCircuitWebWorker: createWorker,
}))
mock.module("posthog-js", () => ({
  default: {
    init: initTelemetry,
    identify: () => {},
    capture: () => {},
    captureException: () => {},
  },
}))
mock.module("@tscircuit/pcb-viewer", () => ({
  usePcbViewerController,
  PCBViewer: ({ renderer }: { renderer?: string }) => (
    <div data-pcb-renderer={renderer ?? "default"} />
  ),
}))

test("one config controls worker fallback, telemetry, version menu and renderer", async () => {
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
  const network = mock(async () => new Response('{"versions":[]}'))
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
      fetch: network,
    },
  )
  ;(dom.window as any).TSCIRCUIT_USE_RUNFRAME_FOR_CLI = true
  ;(dom.window as any).fetch = network
  let root = createRoot(document.getElementById("root")!)
  try {
    const { RunFrame } = await import("../../lib/components/RunFrame/RunFrame")
    const { CircuitJsonPreview } = await import(
      "../../lib/components/CircuitJsonPreview/CircuitJsonPreview"
    )
    expect(initTelemetry).not.toHaveBeenCalled()
    const platformConfig = {
      projectBaseUrl: "http://localhost/project",
      enablePartOrientationAnalysis: false,
      partsEngine: { findPart: () => ({}) },
      telemetryDisabled: true,
      evalCdnLoadingDisabled: true,
      evalVersionSelectionDisabled: true,
      pcbRenderer: "canvas" as const,
    }
    await act(async () => {
      root.render(
        <RunFrame
          fsMap={{}}
          isLoadingFiles
          platformConfig={platformConfig}
          evalVersion="0.0.1580"
          evalWebWorkerBlobUrl="/assets/eval-worker.js"
          availableTabs={["errors"]}
          showFileMenu={false}
        />,
      )
    })
    expect(createWorker).toHaveBeenCalledTimes(1)
    expect(createWorker.mock.calls[0][0]).toMatchObject({
      disableCdnLoading: true,
      projectConfig: {
        projectBaseUrl: platformConfig.projectBaseUrl,
        enablePartOrientationAnalysis: false,
      },
      platform: {
        projectBaseUrl: platformConfig.projectBaseUrl,
        partsEngine: platformConfig.partsEngine,
        enablePartOrientationAnalysis: false,
      },
    })
    const options = createWorker.mock.calls[0][0] as { platform: object }
    expect(Object.keys(options.platform).sort()).toEqual([
      "enablePartOrientationAnalysis",
      "partsEngine",
      "projectBaseUrl",
    ])
    expect(initTelemetry).not.toHaveBeenCalled()
    expect(network).not.toHaveBeenCalled()
    await act(async () => root.unmount())
    root = createRoot(document.getElementById("root")!)
    globalThis.runFrameWorker = undefined
    await act(async () => {
      root.render(
        <RunFrame
          fsMap={{}}
          isLoadingFiles
          platformConfig={{ ...platformConfig, evalCdnLoadingDisabled: false }}
          evalVersion="0.0.1580"
          evalWebWorkerBlobUrl="/assets/eval-worker.js"
          availableTabs={["errors"]}
          showFileMenu={false}
        />,
      )
    })
    // An explicit platform choice takes precedence over the legacy CLI default.
    expect(createWorker.mock.calls.at(-1)?.[0]).toMatchObject({
      disableCdnLoading: false,
    })
    await act(async () => root.unmount())
    root = createRoot(document.getElementById("root")!)
    for (const renderer of ["canvas", "webgpu", undefined] as const) {
      await act(async () =>
        root.render(
          <CircuitJsonPreview
            circuitJson={[]}
            platformConfig={{ ...platformConfig, pcbRenderer: renderer }}
            availableTabs={["pcb"]}
            defaultActiveTab="pcb"
          />,
        ),
      )
      expect(
        document
          .querySelector("[data-pcb-renderer]")
          ?.getAttribute("data-pcb-renderer"),
      ).toBe(renderer ?? "default")
    }
    expect(initTelemetry).not.toHaveBeenCalled()
    expect(network).not.toHaveBeenCalled()
    // Preserve the existing direct-preview override for callers that want it.
    await act(async () =>
      root.render(
        <CircuitJsonPreview
          circuitJson={[]}
          platformConfig={platformConfig}
          allowSelectingVersion
          availableTabs={["errors"]}
        />,
      ),
    )
    expect(network).toHaveBeenCalledTimes(1)
    await act(async () =>
      root.render(
        <CircuitJsonPreview
          circuitJson={[]}
          platformConfig={{ evalVersionSelectionDisabled: true }}
          availableTabs={["errors"]}
        />,
      ),
    )
    expect(initTelemetry.mock.calls.length).toBeGreaterThan(0)
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
