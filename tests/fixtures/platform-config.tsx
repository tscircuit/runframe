import { expect, mock, test } from "bun:test"
import type { PlatformConfig } from "@tscircuit/props"
import { useSchematicViewerController } from "@tscircuit/schematic-viewer"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"

const createWorker = mock(async (_options: unknown) => ({}))
const previewConfigs: (PlatformConfig | undefined)[] = []
mock.module("@tscircuit/eval/worker", () => ({
  createCircuitWebWorker: createWorker,
}))
mock.module("posthog-js", () => ({
  default: {
    init: () => {},
    identify: () => {},
    capture: () => {},
    captureException: () => {},
  },
}))
mock.module("@tscircuit/schematic-viewer", () => ({
  useSchematicViewerController,
  AnalogSimulationViewer: () => null,
  SchematicViewer: ({
    platformConfig,
  }: { platformConfig?: PlatformConfig }) => {
    previewConfigs.push(platformConfig)
    return <div data-testid="schematic-viewer" />
  },
}))

test("shared circuit hooks reach the evaluator and schematic viewer unchanged", async () => {
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
  ;(dom.window as any).fetch = network
  let root = createRoot(document.getElementById("root")!)
  try {
    const { RunFrame } = await import("../../lib/components/RunFrame/RunFrame")
    const platformConfig: PlatformConfig = {
      projectBaseUrl: "http://localhost/project",
      enablePartOrientationAnalysis: false,
      partsEngine: { findPart: () => ({}) },
      platformFetch: network as typeof fetch,
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
    expect(createWorker).toHaveBeenCalledTimes(1)
    const options = createWorker.mock.calls[0][0] as {
      platform: PlatformConfig
      projectConfig: Partial<PlatformConfig>
    }
    expect(options.platform).toBe(platformConfig)
    expect(options.projectConfig).toMatchObject({
      projectBaseUrl: platformConfig.projectBaseUrl,
      enablePartOrientationAnalysis: false,
    })
    expect(network).not.toHaveBeenCalled()

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
    expect(createWorker).toHaveBeenCalledTimes(1)
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
