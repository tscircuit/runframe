import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import type { ExtraRunFrameTab } from "../../lib/components/CircuitJsonPreview/extra-runframe-tabs"

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

mock.module("@tscircuit/system-block-viewer", () => ({
  SystemBlockViewer: () => null,
}))
mock.module("@tscircuit/drawing-viewer", () => ({ DrawingViewer: () => null }))
test("missing circuit views disappear and optional views fit the header", async () => {
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
  let width = 600
  let resize = () => {}
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => width,
  })
  HTMLElement.prototype.getBoundingClientRect = () => ({ width: 80 }) as DOMRect
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    value: class {
      constructor(callback: () => void) {
        resize = callback
      }
      observe() {}
      disconnect() {}
    },
  })
  try {
    const { CircuitJsonPreview } = await import(
      "../../lib/components/CircuitJsonPreview/CircuitJsonPreview"
    )
    const render = async (types: string[] | null, availableTabs?: any) => {
      await act(async () =>
        root.render(
          <CircuitJsonPreview
            circuitJson={types?.map((type) => ({ type })) as any}
            availableTabs={availableTabs}
            allowSelectingVersion={false}
            showToggleFullScreen={false}
          />,
        ),
      )
    }
    const tabs = () =>
      Array.from(document.querySelectorAll('[role="tab"]'))
        .filter((tab) => tab.getAttribute("aria-hidden") !== "true")
        .map((tab) => tab.textContent)
    await render(null)
    expect(tabs()).toContain("PCB")
    expect(tabs()).toContain("Schematic")
    await render(["schematic_group", "system_block_page", "drawing_page"])
    expect(tabs()).not.toContain("PCB")
    expect(tabs()).toContain("Schematic")
    expect(tabs()).toContain("System")
    expect(tabs()).toContain("Drawing")
    expect(
      document.querySelector('[role="tab"][data-state="active"]')?.textContent,
    ).toBe("Schematic")
    width = 260
    await act(async () => resize())
    expect(tabs()).not.toContain("System")
    expect(tabs()).not.toContain("Drawing")
    width = 600
    await act(async () => resize())
    expect(tabs()).toContain("System")
    expect(tabs()).toContain("Drawing")
    await act(async () => {
      Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
        .find((tab) => tab.textContent === "System")!
        .dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
        )
    })
    expect(
      document.querySelector('[role="tab"][data-state="active"]')?.textContent,
    ).toBe("System")
    expect(tabs().filter((tab) => tab === "System")).toHaveLength(1)
    width = 180
    await act(async () => resize())
    expect(tabs()).toContain("System")
    expect(tabs()).not.toContain("Drawing")
    await render(["pcb_board"])
    expect(tabs()).toContain("PCB")
    expect(tabs()).not.toContain("Schematic")
    await act(async () => {
      Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
        .find((tab) => tab.textContent === "PCB")!
        .dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
        )
    })
    expect(tabs()).not.toContain("System")
    await render(["pcb_panel", "schematic_group"])
    expect(tabs()).not.toContain("Schematic")
    await render(["pcb_trace_error"])
    expect(tabs()).not.toContain("PCB")
    await render(["system_block_page", "drawing_page"], ["system"])
    expect(tabs()).toEqual(["System"])
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
  }
})
