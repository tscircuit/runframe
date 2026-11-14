import { expect, mock, test } from "bun:test"
import { MockLanguageModelV4 } from "ai/test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { RunFrameAiProvider } from "../../lib/ai/RunFrameAiProvider"
import {
  createDatasheetModel,
  generatedCircuitAssets,
  generatedAssets,
  modelResponse,
  pdfFile,
} from "./datasheet-ai"

test("dialog generates only on request, reviews files, and accepts explicitly", async () => {
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
  const { DatasheetImportDialog } = await import(
    "../../lib/components/DatasheetImportDialog"
  )
  const root = createRoot(document.getElementById("root")!)
  const accepted = mock(async () => {})
  const close = mock(() => {})
  const model = createDatasheetModel()
  const render = async (
    selectedModel: typeof model | undefined = model,
    isOpen = true,
  ) => {
    await act(async () =>
      root.render(
        <RunFrameAiProvider
          ai={selectedModel ? { model: selectedModel } : undefined}
        >
          <DatasheetImportDialog
            isOpen={isOpen}
            onClose={close}
            onAssetsGenerated={accepted}
          />
        </RunFrameAiProvider>,
      ),
    )
  }
  const button = (label: string) =>
    Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent === label,
    )!
  const click = async (label: string) =>
    act(async () => {
      button(label).dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
  const drop = async (files: File[]) =>
    act(async () => {
      const input = document.querySelector('input[type="file"]')!
      const event = new Event("drop", { bubbles: true, cancelable: true })
      Object.defineProperty(event, "dataTransfer", { value: { files } })
      input.parentElement!.dispatchEvent(event)
    })
  const until = async (condition: () => boolean) => {
    for (let i = 0; i < 100 && !condition(); i++) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5))
      })
    }
    expect(condition()).toBe(true)
  }
  try {
    await render()
    expect(model.doGenerateCalls).toHaveLength(0)
    expect(button("Generate assets").disabled).toBe(true)
    await drop([new File(["text"], "wrong.txt")])
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "Choose a PDF",
    )
    await drop([pdfFile(), pdfFile()])
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "one PDF",
    )
    await drop([pdfFile()])
    expect(model.doGenerateCalls).toHaveLength(0)
    await click("Generate assets")
    await until(() =>
      Boolean(document.querySelector('[aria-label="Generated assets"]')),
    )
    expect(model.doGenerateCalls).toHaveLength(1)
    expect(document.body.textContent).toContain("test123.footprint.tsx")
    expect(document.body.textContent).toContain("SPICE model: unavailable")
    expect(document.body.textContent).toContain(generatedAssets.warnings[0])
    expect(accepted).not.toHaveBeenCalled()
    await click("Use generated files")
    expect(accepted).toHaveBeenCalledWith(generatedAssets)
    expect(close).toHaveBeenCalledTimes(1)

    const circuits = createDatasheetModel(generatedCircuitAssets)
    await render(circuits)
    expect(
      document.querySelector('input[placeholder="e.g. LM358, SOIC-8"]'),
    ).toBeNull()
    expect(document.querySelector('input[type="radio"]')).toBeNull()
    const switches = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[role="switch"]'),
    )
    expect(switches).toHaveLength(2)
    expect(switches.every((input) => !input.checked)).toBe(true)
    await act(async () => {
      switches[0].click()
      switches[1].click()
    })
    expect(circuits.doGenerateCalls).toHaveLength(0)
    await drop([pdfFile()])
    await click("Generate assets")
    await until(() => Boolean(button("Use simulation circuit")))
    expect(button("Use chip alone")).toBeDefined()
    expect(button("Use reference circuit")).toBeDefined()
    expect(document.querySelector('input[type="radio"]')).toBeNull()
    expect(circuits.doGenerateCalls).toHaveLength(1)
    expect(switches.every((input) => input.checked)).toBe(true)
    await click("Use chip alone")
    expect(accepted).toHaveBeenLastCalledWith(generatedCircuitAssets, {
      kind: "component",
      entrypoint: generatedCircuitAssets.component!.filename,
    })
    accepted.mockImplementationOnce(async () => {
      throw new Error("Could not save circuit")
    })
    await click("Use simulation circuit")
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "Could not save circuit",
    )
    expect(button("Use chip alone")).toBeDefined()
    expect(button("Use simulation circuit")).toBeDefined()
    await click("Use simulation circuit")
    expect(accepted).toHaveBeenLastCalledWith(generatedCircuitAssets, {
      kind: "simulationCircuit",
      entrypoint: generatedCircuitAssets.simulationCircuit!.filename,
    })
    await click("Use reference circuit")
    expect(accepted).toHaveBeenLastCalledWith(generatedCircuitAssets, {
      kind: "referenceCircuit",
      entrypoint: generatedCircuitAssets.referenceCircuit!.filename,
    })
    await act(async () => switches[1].click())
    expect(document.querySelector('[aria-label="Generated assets"]')).toBeNull()
    await click("Generate assets")
    await until(() => Boolean(button("Use simulation circuit")))
    expect(button("Use reference circuit")).toBeUndefined()
    expect(circuits.doGenerateCalls).toHaveLength(2)

    const noAssets = createDatasheetModel({
      ...generatedAssets,
      footprint: null,
      symbol: null,
      warnings: [
        "The document contains no usable dimensions or pin information.",
      ],
    })
    await render(noAssets)
    await drop([pdfFile()])
    await click("Generate assets")
    await until(() =>
      Boolean(document.querySelector('[aria-label="Generated assets"]')),
    )
    expect(document.body.textContent).toContain("No assets generated")
    expect(document.body.textContent).not.toContain("Footprint: unavailable")
    expect(button("Use generated files")).toBeUndefined()

    await render(model, false)
    const failing = new MockLanguageModelV4({
      doGenerate: async () => {
        throw new Error("Provider unavailable")
      },
    })
    await render(failing)
    await drop([pdfFile()])
    await click("Generate assets")
    await until(() => Boolean(document.querySelector('[role="alert"]')))
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "Provider unavailable",
    )
    expect(button("Generate assets").disabled).toBe(false)

    await render(model)
    await drop([pdfFile()])
    await click("Generate assets")
    await until(() =>
      Boolean(document.querySelector('[aria-label="Generated assets"]')),
    )
    accepted.mockImplementationOnce(async () => {
      throw new Error("Could not save")
    })
    await click("Use generated files")
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "Could not save",
    )
    expect(
      document.querySelector('[aria-label="Generated assets"]'),
    ).not.toBeNull()

    let complete!: (value: ReturnType<typeof modelResponse>) => void
    const pending = new MockLanguageModelV4({
      doGenerate: async () =>
        new Promise((resolve) => {
          complete = resolve
        }),
    })
    await render(pending)
    await drop([pdfFile()])
    await click("Generate assets")
    await until(() => pending.doGenerateCalls.length === 1)
    await click("Cancel generation")
    await act(async () => complete(modelResponse()))
    expect(document.querySelector('[aria-label="Generated assets"]')).toBeNull()
    expect(button("Generate assets").disabled).toBe(false)

    await click("Generate assets")
    await until(() => pending.doGenerateCalls.length === 2)
    await render(pending, false)
    await act(async () => complete(modelResponse()))
    await render(pending, true)
    expect(document.querySelector('[aria-label="Generated assets"]')).toBeNull()
    expect(button("Generate assets").disabled).toBe(true)
    await act(async () =>
      root.render(<DatasheetImportDialog isOpen onClose={close} />),
    )
    expect(document.body.textContent).toContain("AI is not configured")
    expect(document.querySelector('input[type="file"]')).toBeNull()
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
  }
})
