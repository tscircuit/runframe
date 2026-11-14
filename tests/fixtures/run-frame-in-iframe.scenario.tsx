import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import example from "../../examples/assets/system-blocks.circuit.json"

mock.module("@tscircuit/eval/worker", () => ({
  createCircuitWebWorker: async () => {
    throw new Error("Static Circuit JSON must not create an eval worker")
  },
}))
mock.module("posthog-js", () => ({
  default: { init() {}, identify() {}, capture() {}, captureException() {} },
}))
mock.module("@tscircuit/3d-viewer", () => ({ CadViewer: () => null }))
mock.module("@tscircuit/pcb-viewer", () => ({
  PCBViewer: () => null,
  usePcbViewerController: () => ({ controller: {}, focusPcbComponent() {} }),
}))
mock.module("@tscircuit/schematic-viewer", () => ({
  SchematicViewer: () => null,
  AnalogSimulationViewer: () => null,
  useSchematicViewerController: () => ({
    controller: {},
    focusSchematicComponent() {},
  }),
}))
mock.module("@tscircuit/assembly-viewer", () => ({
  AssemblyViewer: () => null,
  PinoutViewer: () => null,
}))
mock.module("lib/components/PcbViewerWithContainerHeight", () => ({
  PcbViewerWithContainerHeight: () => <div data-testid="pcb-viewer" />,
}))

test("RunFrameInIframe takes its props from the parent window and reports back", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "https://host.example/",
    pretendToBeVisual: true,
  })
  const globals = [
    "window",
    "document",
    "location",
    "localStorage",
    "Element",
    "HTMLElement",
    "HTMLInputElement",
    "Node",
    "Event",
    "CustomEvent",
    "MessageEvent",
    "NodeFilter",
    "MouseEvent",
    "WheelEvent",
    "KeyboardEvent",
    "MutationObserver",
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
  ]
  for (const key of globals)
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value: Reflect.get(dom.window, key),
    })
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
    configurable: true,
    value: true,
  })
  // Keeps the preview from looking up eval versions over the network.
  Reflect.set(dom.window, "TSCIRCUIT_ALLOW_SELECTING_EVAL_VERSION", false)

  // In this test the page is its own parent, so what it posts arrives here.
  const posted: any[] = []
  const realPostMessage = window.parent.postMessage.bind(window.parent)
  window.parent.postMessage = ((message: any) => {
    posted.push(message)
  }) as typeof window.postMessage
  const sendFromParent = (runframe_props: Record<string, unknown>) =>
    act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { runframe_type: "runframe_props_changed", runframe_props },
          source: window.parent,
          origin: "https://host.example",
        }),
      )
    })
  const eventsOfType = (type: string) =>
    posted
      .filter((message) => message.runframe_type === "runframe_event")
      .map((message) => message.runframe_event)
      .filter((event) => event.type === type)

  const root = createRoot(document.getElementById("root")!)
  try {
    const { RunFrameInIframe } = await import(
      "../../lib/components/RunFrameInIframe/RunFrameInIframe"
    )
    const systemDiagram = () =>
      document.querySelector('[aria-label="System diagram viewport"]')
    const pcbViewer = () => document.querySelector('[data-testid="pcb-viewer"]')

    await act(async () => root.render(<RunFrameInIframe />))
    expect(posted[0]).toEqual({
      runframe_type: "runframe_ready_to_receive",
      runframe_capabilities: ["show_header", "active_tab", "render_events"],
    })
    expect(document.body.textContent).toContain("Waiting for code")

    await sendFromParent({
      fsMap: { "board.circuit.json": JSON.stringify(example) },
      mainComponentPath: "board.circuit.json",
      showHeader: false,
      showFileMenu: false,
      activeTab: "system",
    })
    expect(document.querySelectorAll('[role="tab"]').length).toBe(0)
    expect(systemDiagram()).not.toBeNull()
    expect(
      eventsOfType("circuit_json_changed").at(-1)?.circuit_json_element_counts
        .system_block_page,
    ).toBe(1)
    expect(eventsOfType("run_completed").at(-1)).toMatchObject({
      has_execution_error: false,
    })
    // Both names for the envelope, for hosts written against either.
    expect(posted.at(-1)).toMatchObject({
      runframe_type: "runframe_event",
      type: "runframe_event",
    })

    // A later message changes only what it names: the files stay.
    await sendFromParent({ activeTab: "pcb" })
    expect(systemDiagram()).toBeNull()
    expect(pcbViewer()).not.toBeNull()
  } finally {
    await act(async () => root.unmount())
    window.parent.postMessage = realPostMessage
    dom.window.close()
  }
})
