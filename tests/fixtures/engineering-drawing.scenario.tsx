import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import type { CircuitJson } from "circuit-json"
import type { DrawingPageOutput } from "@tscircuit/circuit-json-to-drawing"
import { engineeringDrawingCircuit } from "../../examples/assets/engineering-drawing"

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

const requests: {
  resolve: (pages: DrawingPageOutput[]) => void
  reject: (error: Error) => void
}[] = []
mock.module(
  "../../lib/components/EngineeringDrawingViewer/render-drawing-pages",
  () => ({
    renderDrawingPages: () =>
      new Promise<DrawingPageOutput[]>((resolve, reject) => {
        requests.push({ resolve, reject })
      }),
  }),
)
const pages = [
  {
    drawingPageId: "overview",
    svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>Overview geometry</text></svg>',
  },
  {
    drawingPageId: "section",
    svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>Section geometry</text></svg>',
  },
]

test("drawing pages load on selection, switch, reject stale results and recover errors", async () => {
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
  const { CircuitJsonPreview } = await import(
    "../../lib/components/CircuitJsonPreview/CircuitJsonPreview"
  )
  const render = (
    circuitJson: CircuitJson,
    availableTabs?: ("pcb" | "engineering_drawing")[],
  ) => (
    <CircuitJsonPreview
      circuitJson={circuitJson}
      availableTabs={availableTabs}
      allowSelectingVersion={false}
      showToggleFullScreen={false}
    />
  )
  const openMenu = async () => {
    await act(async () => {
      document
        .querySelector('[aria-label="More views"]')!
        .dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
        )
    })
  }
  const svg = () =>
    decodeURIComponent(
      document
        .querySelector<HTMLImageElement>("img")!
        .src.split(",")
        .slice(1)
        .join(","),
    )
  try {
    await act(async () => root.render(render(engineeringDrawingCircuit)))
    expect(requests).toHaveLength(0)
    await openMenu()
    const drawingItem = [
      ...document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    ].find((item) => item.textContent === "Engineering Drawing")!
    expect(drawingItem).toBeDefined()
    await act(async () => drawingItem.click())
    expect(
      document.querySelector('[role="tab"][data-state="active"]')?.textContent,
    ).toBe("Engineering Drawing")
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      "Rendering engineering drawings",
    )
    await act(async () => requests[0].resolve(pages))
    expect(svg()).toContain("Overview geometry")
    const select = document.querySelector<HTMLSelectElement>(
      '[aria-label="Drawing page"]',
    )!
    expect(select.options[1].textContent).toBe("Bracket section")
    await act(async () => {
      select.value = "section"
      select.dispatchEvent(new Event("change", { bubbles: true }))
    })
    expect(svg()).toContain("Section geometry")
    const rerun = engineeringDrawingCircuit.filter(
      (element) =>
        !(
          element.type === "drawing_page" &&
          element.drawing_page_id === "section"
        ) &&
        !(
          element.type === "drawing_part_view" &&
          element.drawing_page_id === "section"
        ),
    )
    await act(async () => root.render(render(rerun)))
    expect(document.querySelector("img")).toBeNull()
    await act(async () => requests[1].resolve(pages.slice(0, 1)))
    expect(svg()).toContain("Overview geometry")
    expect(document.querySelector('[aria-label="Drawing page"]')).toBeNull()
    await act(async () => root.render(render([...rerun])))
    await act(async () => root.render(render([])))
    await act(async () => requests[2].resolve(pages))
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      "No engineering drawings",
    )
    expect(document.querySelector("img")).toBeNull()
    await act(async () => root.render(render(engineeringDrawingCircuit)))
    await act(async () => requests[3].reject(new Error("Model unavailable")))
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "Model unavailable",
    )
    expect(document.querySelector('[role="alert"] h2')?.textContent).toBe(
      "Error loading Engineering Drawing",
    )
    await act(async () =>
      [...document.querySelectorAll("button")]
        .find((button) => button.textContent === "Retry")!
        .click(),
    )
    await act(async () => requests[4].resolve(pages))
    expect(svg()).toContain("Overview geometry")
    await act(async () => root.render(render([...engineeringDrawingCircuit])))
    await act(async () => requests[5].reject(new Error("Invalid drawing page")))
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "Invalid drawing page",
    )
    await act(async () => root.render(render([...engineeringDrawingCircuit])))
    await act(async () => requests[6].resolve(pages))
    expect(document.querySelector('[role="alert"]')).toBeNull()
    expect(svg()).toContain("Overview geometry")
    await act(async () =>
      root.render(render(engineeringDrawingCircuit, ["pcb"])),
    )
    expect(
      document.querySelector('[role="tab"][data-state="active"]')?.textContent,
    ).toBe("PCB")
    await openMenu()
    expect(
      [...document.querySelectorAll('[role="menuitem"]')].some(
        (item) => item.textContent === "Engineering Drawing",
      ),
    ).toBe(false)
    await act(async () =>
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      ),
    )
    await act(async () => root.render(render([], ["engineering_drawing"])))
    expect(
      document.querySelector('[role="tab"][data-state="active"]')?.textContent,
    ).toBe("Engineering Drawing")
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      "No engineering drawings",
    )
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
  }
}, 15000)
