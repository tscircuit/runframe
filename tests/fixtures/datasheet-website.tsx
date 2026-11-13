import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { createDatasheetModel, generatedAssets, pdfFile } from "./datasheet-ai"

mock.module("@tscircuit/3d-viewer", () => ({
  CadViewer: () => <div data-testid="3d-viewer" />,
}))
mock.module("lib/components/PcbViewerWithContainerHeight", () => ({
  PcbViewerWithContainerHeight: () => <div data-testid="pcb-viewer" />,
}))

test("the website RunFrame exposes the datasheet action with its File menu hidden", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "http://localhost",
    pretendToBeVisual: true,
  })
  for (const name of [
    "window",
    "document",
    "location",
    "Element",
    "HTMLElement",
    "HTMLInputElement",
    "HTMLButtonElement",
    "Node",
    "NodeFilter",
    "Event",
    "MouseEvent",
    "KeyboardEvent",
    "CustomEvent",
    "DocumentFragment",
    "MutationObserver",
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
  ]) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value: (dom.window as any)[name],
    })
  }
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  window.TSCIRCUIT_TELEMETRY_DISABLED = true
  window.TSCIRCUIT_ALLOW_SELECTING_EVAL_VERSION = false
  const { RunFrame } = await import("../../lib/components/RunFrame/RunFrame")
  const model = createDatasheetModel()
  const accepted = mock(async (_assets: unknown) => {})
  const root = createRoot(document.getElementById("root")!)
  const button = (text: string) =>
    Array.from(document.querySelectorAll("button")).find(
      (element) => element.textContent?.trim() === text,
    )
  const click = async (element: HTMLElement) =>
    act(async () => {
      element.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          button: 0,
          ctrlKey: false,
        }),
      )
      element.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
  const render = async (enabled: boolean) =>
    act(async () =>
      root.render(
        <RunFrame
          fsMap={{ "board.circuit.json": "[]" }}
          mainComponentPath="board.circuit.json"
          showFileMenu={false}
          showRunButton
          isWebEmbedded
          defaultActiveTab="cad"
          availableTabs={["pcb", "cad"]}
          ai={enabled ? { model } : undefined}
          onDatasheetAssetsGenerated={accepted}
        />,
      ),
    )
  try {
    await render(true)
    expect(button("File")).toBeUndefined()
    expect(button("Run")).toBeDefined()
    expect(button("Create from datasheet")).toBeDefined()
    expect(document.querySelector('[data-testid="3d-viewer"]')).not.toBeNull()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(model.doGenerateCalls).toHaveLength(0)
    await click(
      Array.from(document.querySelectorAll('[role="tab"]')).find(
        (element) => element.textContent === "PCB",
      ) as HTMLElement,
    )
    expect(document.querySelector('[data-testid="pcb-viewer"]')).not.toBeNull()
    await click(button("Create from datasheet")!)
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
    expect(model.doGenerateCalls).toHaveLength(0)
    await act(async () => {
      const event = new Event("drop", { bubbles: true, cancelable: true })
      Object.defineProperty(event, "dataTransfer", {
        value: { files: [pdfFile()] },
      })
      document
        .querySelector('input[type="file"]')!
        .parentElement!.dispatchEvent(event)
    })
    await click(button("Generate assets")!)
    for (let i = 0; i < 100 && !button("Use generated files"); i++) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5))
      })
    }
    expect(accepted).not.toHaveBeenCalled()
    await click(button("Use generated files")!)
    expect(accepted).toHaveBeenCalledWith(generatedAssets)
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    await render(false)
    expect(button("Create from datasheet")).toBeUndefined()
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
  }
})
