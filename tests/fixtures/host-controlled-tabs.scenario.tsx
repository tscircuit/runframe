import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import type { CircuitJson } from "circuit-json"
import type { TabId } from "../../lib/components/CircuitJsonPreview/PreviewContentProps"
import example from "../../examples/assets/system-blocks.circuit.json"

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

test("a host can hide the header and pick the tab, and is asked before a switch", async () => {
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
  const root = createRoot(document.getElementById("root")!)
  try {
    const { CircuitJsonPreview } = await import(
      "../../lib/components/CircuitJsonPreview/CircuitJsonPreview"
    )
    const circuitJson = example as CircuitJson
    const requested: TabId[] = []
    const render = (props: {
      activeTab?: TabId
      showHeader?: boolean
      errorMessage?: string | null
      circuitJson?: CircuitJson | null
    }) => (
      <CircuitJsonPreview
        circuitJson={
          props.circuitJson === undefined ? circuitJson : props.circuitJson
        }
        activeTab={props.activeTab}
        showHeader={props.showHeader}
        errorMessage={props.errorMessage}
        onActiveTabChange={(tab) => requested.push(tab)}
        allowSelectingVersion={false}
        showToggleFullScreen={false}
      />
    )
    const tabs = () => document.querySelectorAll('[role="tab"]')
    const systemDiagram = () =>
      document.querySelector('[aria-label="System diagram viewport"]')
    const pcbViewer = () => document.querySelector('[data-testid="pcb-viewer"]')

    // A tab left over from an earlier visit, which the host's tab overrides.
    localStorage.setItem("runframe-active-tab", JSON.stringify("schematic"))

    // The header is there unless the host turns it off.
    await act(async () => root.render(render({})))
    expect(tabs().length).toBeGreaterThan(0)
    expect(document.querySelector('[aria-label="More views"]')).not.toBeNull()

    // Without the header there is nothing to click, so the host's tab decides.
    await act(async () =>
      root.render(render({ showHeader: false, activeTab: "system" })),
    )
    expect(tabs().length).toBe(0)
    expect(document.querySelector('[aria-label="More views"]')).toBeNull()
    expect(systemDiagram()).not.toBeNull()
    expect(pcbViewer()).toBeNull()

    await act(async () =>
      root.render(render({ showHeader: false, activeTab: "pcb" })),
    )
    expect(systemDiagram()).toBeNull()
    expect(pcbViewer()).not.toBeNull()

    // A failed run asks for the errors tab and leaves the switch to the host.
    requested.length = 0
    await act(async () =>
      root.render(
        render({
          showHeader: false,
          activeTab: "pcb",
          errorMessage: "Unexpected token",
          circuitJson: null,
        }),
      ),
    )
    expect(requested).toEqual(["errors"])
    expect(document.body.textContent).not.toContain("Unexpected token")

    await act(async () =>
      root.render(
        render({
          showHeader: false,
          activeTab: "errors",
          errorMessage: "Unexpected token",
          circuitJson: null,
        }),
      ),
    )
    expect(document.body.textContent).toContain("Unexpected token")

    // Once a run succeeds again, it asks for the tab it left.
    requested.length = 0
    await act(async () =>
      root.render(render({ showHeader: false, activeTab: "errors" })),
    )
    expect(requested).toEqual(["pcb"])

    // A tab the preview does not have is ignored, so nothing is left blank.
    await act(async () =>
      root.render(
        render({ showHeader: false, activeTab: "not_a_tab" as TabId }),
      ),
    )
    expect(
      document.querySelector('[role="tabpanel"][data-state="active"]'),
    ).not.toBeNull()
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
  }
})
