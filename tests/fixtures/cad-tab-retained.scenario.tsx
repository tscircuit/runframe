import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act, useEffect } from "react"
import { createRoot } from "react-dom/client"
import type { CircuitJson } from "circuit-json"
import type { TabId } from "../../lib/components/CircuitJsonPreview/PreviewContentProps"
import example from "../../examples/assets/system-blocks.circuit.json"

const cad = { mounts: 0, unmounts: 0, drawn: null as CircuitJson | null }

mock.module("posthog-js", () => ({
  default: { init() {}, identify() {}, capture() {}, captureException() {} },
}))
mock.module("@tscircuit/3d-viewer", () => ({
  CadViewer: ({ circuitJson }: { circuitJson: CircuitJson }) => {
    useEffect(() => {
      cad.mounts++
      return () => {
        cad.unmounts++
      }
    }, [])
    cad.drawn = circuitJson
    return <div data-testid="cad-viewer" />
  },
}))
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

test("the 3D view is built once and kept while another view is selected", async () => {
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
    const first = example as CircuitJson
    const edited = [...first] as CircuitJson
    const show = (activeTab: TabId, circuitJson: CircuitJson) =>
      act(async () =>
        root.render(
          <CircuitJsonPreview
            circuitJson={circuitJson}
            activeTab={activeTab}
            showHeader={false}
            allowSelectingVersion={false}
            showToggleFullScreen={false}
          />,
        ),
      )
    const cadPanel = () =>
      document
        .querySelector('[data-testid="cad-viewer"]')
        ?.closest('[role="tabpanel"]') as HTMLElement | null

    // Nothing is built for a view that has not been opened.
    await show("pcb", first)
    expect(cad.mounts).toBe(0)

    await show("cad", first)
    expect(cad.mounts).toBe(1)
    expect(cadPanel()?.style.display).not.toBe("none")

    // Leaving hides the scene instead of throwing it away.
    await show("pcb", first)
    expect(cad.unmounts).toBe(0)
    expect(cadPanel()?.style.display).toBe("none")
    expect(document.querySelector('[data-testid="pcb-viewer"]')).not.toBeNull()

    // A change made while it is hidden is not drawn until it is shown again.
    await show("pcb", edited)
    expect(cad.drawn).toBe(first)

    await show("cad", edited)
    expect(cad.drawn).toBe(edited)
    expect(cad.mounts).toBe(1)
    expect(cad.unmounts).toBe(0)
    expect(cadPanel()?.style.display).not.toBe("none")
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
  }
})
