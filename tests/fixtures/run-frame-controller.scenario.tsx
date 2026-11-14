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

test("useRunFrameController picks the tab, follows RunFrame's own switches and reports each run", async () => {
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
  const root = createRoot(document.getElementById("root")!)
  try {
    const { RunFrame, useRunFrameController } = await import(
      "../../lib/components/RunFrame/RunFrame"
    )
    type Controls = ReturnType<typeof useRunFrameController>
    let controls!: Controls
    const hostCallbacks: string[] = []
    const Host = ({ source }: { source: string }) => {
      controls = useRunFrameController()
      return (
        <RunFrame
          fsMap={{ "board.circuit.json": source }}
          mainComponentPath="board.circuit.json"
          controller={controls.controller}
          showHeader={false}
          showFileMenu={false}
          onRunCompleted={() => hostCallbacks.push("completed")}
          onActiveTabChange={(tab) => hostCallbacks.push(`tab:${tab}`)}
        />
      )
    }
    const systemDiagram = () =>
      document.querySelector('[aria-label="System diagram viewport"]')
    const pcbViewer = () => document.querySelector('[data-testid="pcb-viewer"]')
    const good = JSON.stringify(example)

    // RunFrame picks the first tab, and the host is told what the circuit has.
    await act(async () => root.render(<Host source={good} />))
    expect(document.querySelectorAll('[role="tab"]').length).toBe(0)
    expect(pcbViewer()).not.toBeNull()
    expect(controls.isRunning).toBe(false)
    expect(controls.errorMessage).toBeNull()
    expect(controls.circuitJsonElementCounts?.system_block_page).toBe(1)
    // The host's own callbacks still run beside the controller.
    expect(hostCallbacks).toContain("completed")

    await act(async () => controls.setActiveTab("system"))
    expect(controls.activeTab).toBe("system")
    expect(systemDiagram()).not.toBeNull()
    expect(pcbViewer()).toBeNull()

    // A run that throws sends the host to the errors tab, as RunFrame does itself.
    await act(async () => root.render(<Host source="[" />))
    expect(controls.errorMessage).toContain("Failed to parse circuit.json")
    expect(controls.circuitJsonElementCounts).toBeNull()
    expect(controls.activeTab).toBe("errors")
    expect(document.body.textContent).toContain("Failed to parse circuit.json")

    // And back to the tab it left once the file renders again.
    await act(async () => root.render(<Host source={`${good}\n`} />))
    expect(controls.errorMessage).toBeNull()
    expect(controls.activeTab).toBe("system")
    expect(systemDiagram()).not.toBeNull()
    expect(hostCallbacks).toContain("tab:errors")
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
  }
})
