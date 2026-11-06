import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import type { CircuitJson } from "circuit-json"
import type { DrawingViewerProps } from "@tscircuit/drawing-viewer"
import type { PreviewContentProps } from "../../lib/components/CircuitJsonPreview/PreviewContentProps"
import { createDrawingCircuitJson } from "../../examples/assets/drawing"

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
  PcbViewerWithContainerHeight: () => null,
}))

const receivedCircuits: CircuitJson[] = []
let viewerError: Error | undefined
mock.module("@tscircuit/drawing-viewer", () => ({
  DrawingViewer: ({ circuitJson }: DrawingViewerProps) => {
    if (viewerError) throw viewerError
    receivedCircuits.push(circuitJson)
    return <div data-testid="drawing-viewer-package" />
  },
}))

const renderPreview = async (
  root: Root,
  props: Pick<
    PreviewContentProps,
    "circuitJson" | "availableTabs" | "defaultActiveTab"
  >,
) => {
  const { CircuitJsonPreview } = await import(
    "../../lib/components/CircuitJsonPreview/CircuitJsonPreview"
  )
  await act(async () =>
    root.render(
      <CircuitJsonPreview
        {...props}
        allowSelectingVersion={false}
        showToggleFullScreen={false}
      />,
    ),
  )
}

const openMoreViews = async () => {
  await act(async () => {
    document
      .querySelector('[aria-label="More views"]')!
      .dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      )
  })
}

test("drawing tab delegates to DrawingViewer and preserves navigation, reruns, and error recovery", async () => {
  const drawingCircuit = await createDrawingCircuitJson()
  expect(
    drawingCircuit.filter((element) => element.type.includes("error")),
  ).toEqual([])
  const pages = drawingCircuit.filter(
    (element) => element.type === "drawing_page",
  )
  expect(pages.map((page) => page.display_name).sort()).toEqual([
    "Carrier overview",
    "Mounting hole section",
  ])
  expect(
    drawingCircuit.filter(
      (element) => element.type === "drawing_dimension_line",
    ),
  ).toHaveLength(3)
  expect(
    drawingCircuit.some(
      (element) =>
        element.type === "drawing_part_view" && element.section?.axis === "y",
    ),
  ).toBe(true)

  const dom = new JSDOM('<div id="root"></div>', {
    url: "https://host.example/",
    pretendToBeVisual: true,
  })
  for (const key of [
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
    "KeyboardEvent",
    "MutationObserver",
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
  ]) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value: Reflect.get(dom.window, key),
    })
  }
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
    configurable: true,
    value: true,
  })
  const root = createRoot(document.getElementById("root")!)
  try {
    await renderPreview(root, { circuitJson: drawingCircuit })
    expect(receivedCircuits).toHaveLength(0)
    await openMoreViews()
    const drawingItem = [
      ...document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    ].find((item) => item.textContent === "Drawing")!
    expect(drawingItem).toBeDefined()
    await act(async () => drawingItem.click())
    expect(
      document.querySelector('[role="tab"][data-state="active"]')?.textContent,
    ).toBe("Drawing")
    expect(
      document.querySelector('[data-testid="drawing-viewer-package"]'),
    ).not.toBeNull()
    expect(receivedCircuits.at(-1)).toBe(drawingCircuit)

    const rerun = [...drawingCircuit]
    await renderPreview(root, { circuitJson: rerun })
    expect(receivedCircuits.at(-1)).toBe(rerun)
    await renderPreview(root, { circuitJson: null })
    expect(
      document.querySelector('[data-testid="drawing-viewer-package"]'),
    ).toBeNull()
    expect(document.body.textContent).toContain("Tip:")

    const emptyCircuit: CircuitJson = []
    await renderPreview(root, { circuitJson: emptyCircuit })
    expect(receivedCircuits.at(-1)).toBe(emptyCircuit)
    viewerError = new Error("DrawingViewer failed")
    await renderPreview(root, { circuitJson: drawingCircuit })
    expect(document.querySelector('[role="alert"]')?.textContent).toBe(
      "Error loading Drawing",
    )
    viewerError = undefined
    await renderPreview(root, { circuitJson: rerun })
    expect(document.querySelector('[role="alert"]')).toBeNull()
    expect(receivedCircuits.at(-1)).toBe(rerun)

    await renderPreview(root, {
      circuitJson: drawingCircuit,
      availableTabs: ["pcb"],
    })
    expect(
      document.querySelector('[data-testid="drawing-viewer-package"]'),
    ).toBeNull()
    expect(
      document.querySelector('[role="tab"][data-state="active"]')?.textContent,
    ).toBe("PCB")
    await openMoreViews()
    expect(
      [...document.querySelectorAll('[role="menuitem"]')].some(
        (item) => item.textContent === "Drawing",
      ),
    ).toBe(false)
    await act(async () =>
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      ),
    )
    await renderPreview(root, {
      circuitJson: drawingCircuit,
      availableTabs: ["drawing"],
      defaultActiveTab: "drawing",
    })
    expect(
      document.querySelector('[role="tab"][data-state="active"]')?.textContent,
    ).toBe("Drawing")
    expect(receivedCircuits.at(-1)).toBe(drawingCircuit)
  } finally {
    viewerError = undefined
    await act(async () => root.unmount())
    dom.window.close()
  }
}, 15000)
