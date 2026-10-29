import { expect, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"

test("render details expand, show every effect, and update while open", async () => {
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
    "HTMLButtonElement",
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
    const { RenderStatus } = await import(
      "../../lib/components/CircuitJsonPreview/RenderStatus"
    )
    const effects = Array.from({ length: 12 }, (_, i) => ({
      effectName: `Effect ${i}: a long asynchronous operation description`,
      phase: `Phase ${i}`,
      componentDisplayName: `<resistor name="R${i}" />`,
      startTime: i,
    }))
    const render = (activeAsyncEffects = effects) =>
      root.render(
        <RenderStatus
          renderLog={{
            progress: 0.997,
            lastRenderEvent: {
              type: "board:renderPhaseStarted",
              phase: "PcbTraceRender",
              renderId: "1",
              eventsProcessed: 1,
              createdAt: 0,
            },
          }}
          activeAsyncEffects={activeAsyncEffects}
        />,
      )
    await act(async () => render())
    const trigger = document.querySelector("button")!
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    await act(async () => trigger.click())
    const panel = document.querySelector('[role="dialog"]')!
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    expect(panel.textContent).toContain("PcbTraceRender")
    expect(panel.textContent).toContain("99.7%")
    expect(panel.querySelectorAll("li").length).toBe(12)
    for (const effect of effects) {
      expect(panel.textContent).toContain(effect.effectName)
      expect(panel.textContent).toContain(effect.componentDisplayName)
      expect(panel.textContent).toContain(effect.phase)
    }
    await act(async () => render(effects.slice(1)))
    expect(panel.querySelectorAll("li").length).toBe(11)
    expect(panel.textContent).not.toContain(effects[0].effectName)
    await act(async () => render([]))
    expect(panel.textContent).toContain("No active async effects.")
    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      )
    })
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
  }
})
