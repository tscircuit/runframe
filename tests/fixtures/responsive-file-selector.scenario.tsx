import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act, useState } from "react"
import { createRoot } from "react-dom/client"

mock.module("posthog-js", () => ({
  default: { init() {}, identify() {}, capture() {}, captureException() {} },
}))

test("keyboard opens and dismisses the long-path file selector", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "https://host.example/",
    pretendToBeVisual: true,
  })
  for (const key of [
    "window",
    "document",
    "navigator",
    "location",
    "localStorage",
    "Element",
    "HTMLElement",
    "HTMLInputElement",
    "Node",
    "NodeFilter",
    "Event",
    "CustomEvent",
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
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    value: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  })
  dom.window.HTMLElement.prototype.scrollIntoView = () => {}
  const root = createRoot(document.getElementById("root")!)
  try {
    const { EnhancedFileSelectorCombobox } = await import(
      "../../lib/components/RunFrameWithApi/EnhancedFileSelectorCombobox"
    )
    const longFile =
      "boards/power/VeryLongUnbrokenFilenameForResponsiveSelectorTesting.tsx"
    const App = () => {
      const [currentFile, setCurrentFile] = useState(longFile)
      return (
        <EnhancedFileSelectorCombobox
          files={[longFile, "boards/power/ShortBoard.tsx"]}
          currentFile={currentFile}
          onFileChange={setCurrentFile}
        />
      )
    }
    await act(async () => root.render(<App />))
    const trigger = document.querySelector('[role="combobox"]')!
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true,
          bubbles: true,
        }),
      )
    })
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    expect(
      document.querySelector('input[placeholder="Search for file"]'),
    ).not.toBeNull()
    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      )
    })
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
  }
}, 15000)
