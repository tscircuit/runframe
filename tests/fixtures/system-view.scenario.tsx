import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import type { CircuitJson } from "circuit-json"
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
  PcbViewerWithContainerHeight: () => null,
}))

test("System dropdown renders resolved geometry, switches pages, zooms and recovers reruns", async () => {
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
    const original = example as CircuitJson
    const second = original
      .filter((item) => item.type.startsWith("system_block_"))
      .map((item) => {
        // A second independent page with its own IDs, preserving core-resolved geometry.
        const copy = JSON.parse(JSON.stringify(item), (key, value) =>
          typeof value === "string" &&
          key !== "type" &&
          value.startsWith("system_block_")
            ? `copy_${value}`
            : value,
        )
        if (copy.type === "system_block_page") copy.display_name = "Second page"
        if (copy.type === "system_block_component")
          copy.display_name = "Second-page block"
        return copy
      }) as CircuitJson
    const data = [...original, ...second]
    const render = (
      json: CircuitJson,
      availableTabs?: ("pcb" | "system")[],
    ) => (
      <CircuitJsonPreview
        circuitJson={json}
        availableTabs={availableTabs}
        allowSelectingVersion={false}
        showToggleFullScreen={false}
      />
    )
    await act(async () => root.render(render(data)))
    const more = document.querySelector<HTMLButtonElement>(
      '[aria-label="More views"]',
    )!
    await act(async () =>
      more.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      ),
    )
    const system = [
      ...document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    ].find((item) => item.textContent === "System")!
    expect(system).toBeDefined()
    await act(async () => system.click())
    expect(
      document.querySelector('[role="tab"][data-state="active"]')?.textContent,
    ).toBe("System")
    const svg = () =>
      decodeURIComponent(
        document
          .querySelector<HTMLImageElement>("img[alt]")!
          .src.split(",")
          .slice(1)
          .join(","),
      )
    expect(svg()).toContain("Environment sensor")
    expect(svg()).toContain("I2C")
    expect(svg()).not.toContain("Second-page block")
    await act(async () =>
      document
        .querySelector<HTMLButtonElement>('[aria-label="Zoom in"]')!
        .click(),
    )
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe(
      "125%",
    )
    const pageSelect = document.querySelector<HTMLSelectElement>(
      '[aria-label="System page"]',
    )!
    await act(async () => {
      pageSelect.value = pageSelect.options[1]!.value
      pageSelect.dispatchEvent(new Event("change", { bubbles: true }))
    })
    expect(svg()).toContain("Second-page block")
    expect(svg()).not.toContain("Environment sensor")
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe(
      "100%",
    )
    // Rerunning a circuit that no longer contains the selected page falls back to the first page.
    await act(async () => root.render(render(original)))
    expect(svg()).toContain("Environment sensor")
    expect(document.querySelector('[aria-label="System page"]')).toBeNull()
    await act(async () => root.render(render([])))
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      "No system diagrams",
    )
    await act(async () => root.render(render(original, ["pcb"])))
    expect(
      document.querySelector('[role="tab"][data-state="active"]')?.textContent,
    ).toBe("PCB")
    await act(async () =>
      more.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      ),
    )
    expect(
      [...document.querySelectorAll('[role="menuitem"]')].some(
        (item) => item.textContent === "System",
      ),
    ).toBe(false)
    await act(async () =>
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      ),
    )
    await act(async () => root.render(render(original, ["system"])))
    expect(
      document.querySelector('[role="tab"][data-state="active"]')?.textContent,
    ).toBe("System")
    expect(svg()).toContain("Environment sensor")
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
  }
})
