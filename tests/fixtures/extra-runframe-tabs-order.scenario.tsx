import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"

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

test("fallback respects available tab order on initial selection and external tab removal", async () => {
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
    "MouseEvent",
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
    const tab = {
      tabName: "External viewer",
      iframeUrl: "https://viewer.example/",
    }
    localStorage.clear()
    await act(async () =>
      root.render(
        <CircuitJsonPreview
          circuitJson={null}
          availableTabs={["schematic", "pcb"]}
          allowSelectingVersion={false}
          showToggleFullScreen={false}
        />,
      ),
    )
    expect(
      document.querySelector('[role="tab"][data-state="active"]')?.textContent,
    ).toBe("Schematic")
    expect(JSON.parse(localStorage.getItem("runframe-active-tab")!)).toBe(
      "schematic",
    )

    await act(async () => root.render(null))
    localStorage.setItem(
      "runframe-active-tab",
      JSON.stringify("extra:External%20viewer"),
    )
    await act(async () =>
      root.render(
        <CircuitJsonPreview
          circuitJson={null}
          availableTabs={["schematic", "pcb"]}
          extraTabs={[tab]}
          allowSelectingVersion={false}
          showToggleFullScreen={false}
        />,
      ),
    )
    expect(
      document.querySelector('[role="tab"][data-state="active"]')?.textContent,
    ).toBe("External viewer")
    await act(async () =>
      root.render(
        <CircuitJsonPreview
          circuitJson={null}
          availableTabs={["schematic", "pcb"]}
          extraTabs={[]}
          allowSelectingVersion={false}
          showToggleFullScreen={false}
        />,
      ),
    )
    expect(
      document.querySelector('[role="tab"][data-state="active"]')?.textContent,
    ).toBe("Schematic")
    expect(JSON.parse(localStorage.getItem("runframe-active-tab")!)).toBe(
      "schematic",
    )

    await act(async () => root.render(null))
    localStorage.clear()
    await act(async () =>
      root.render(
        <CircuitJsonPreview
          circuitJson={null}
          availableTabs={["schematic", "pcb"]}
          defaultActiveTab="pcb"
          allowSelectingVersion={false}
          showToggleFullScreen={false}
        />,
      ),
    )
    expect(
      document.querySelector('[role="tab"][data-state="active"]')?.textContent,
    ).toBe("PCB")
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
  }
})
