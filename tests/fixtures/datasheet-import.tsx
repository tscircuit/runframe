import { expect, mock, test } from "bun:test"
import { MockLanguageModelV4 } from "ai/test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { RunFrameAiProvider } from "../../lib/ai/RunFrameAiProvider"
import {
  createDatasheetModel,
  generatedCircuitAssets,
  modelResponse,
  pdfFile,
} from "./datasheet-ai"

test("generations save before use, remain open, track additions and retain retryable output", async () => {
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
  ])
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value: (dom.window as any)[name],
    })
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  const { DatasheetImportDialog } = await import(
    "../../lib/components/DatasheetImportDialog"
  )
  const root = createRoot(document.getElementById("root")!)
  const added = mock(async (_assets: unknown, _selection?: unknown) => {})
  const saved = mock(async (_generation: any) => {})
  const close = mock(() => {})
  const model = createDatasheetModel(generatedCircuitAssets)
  const render = async (selected = model, open = true) =>
    act(async () =>
      root.render(
        <RunFrameAiProvider ai={{ model: selected }}>
          <DatasheetImportDialog
            isOpen={open}
            onClose={close}
            onAssetsGenerated={added}
            onGenerationCreated={saved}
          />
        </RunFrameAiProvider>,
      ),
    )
  const button = (text: string) =>
    Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === text,
    )!
  const click = async (text: string) => act(async () => button(text).click())
  const drop = async (files: File[]) =>
    act(async () => {
      const event = new Event("drop", { bubbles: true, cancelable: true })
      Object.defineProperty(event, "dataTransfer", { value: { files } })
      document.querySelector(".ds-upload")!.dispatchEvent(event)
    })
  const until = async (check: () => boolean) => {
    for (let i = 0; i < 150 && !check(); i++)
      await act(async () => {
        await new Promise((r) => setTimeout(r, 5))
      })
    expect(check()).toBe(true)
  }
  const useButton = (kind: string) =>
    document.querySelector<HTMLButtonElement>(
      `article[aria-label="${kind}"] button`,
    )!
  try {
    await render()
    expect(button("Generate").disabled).toBe(true)
    expect(document.querySelector("input[type=radio]")).toBeNull()
    await drop([new File(["bad"], "wrong.txt")])
    expect(document.querySelector("[role=alert]")?.textContent).toContain(
      "Choose a PDF",
    )
    await drop([pdfFile(), pdfFile()])
    expect(document.querySelector("[role=alert]")?.textContent).toContain(
      "one PDF",
    )
    await drop([pdfFile()])
    const switches = Array.from(
      document.querySelectorAll<HTMLInputElement>("input[role=switch]"),
    )
    expect(switches.every((s) => !s.checked)).toBe(true)
    await act(async () => switches.forEach((s) => s.click()))
    expect(model.doGenerateCalls).toHaveLength(0)
    let finishSave!: () => void
    saved.mockImplementationOnce(
      () => new Promise<void>((resolve) => (finishSave = resolve)),
    )
    await click("Generate")
    await until(() => saved.mock.calls.length === 1)
    const generation = saved.mock.calls[0][0]
    expect(Object.keys(generation.files)).toHaveLength(7)
    expect(useButton("Chip").disabled).toBe(true)
    expect(added).not.toHaveBeenCalled()
    await act(async () => finishSave())
    await until(() => !useButton("Chip").disabled)
    expect(document.querySelector(".ds-components")?.textContent).not.toContain(
      generatedCircuitAssets.summary,
    )
    expect(document.querySelector(".ds-options")?.textContent).toBe(
      "Simulation circuitReference circuit",
    )
    added.mockImplementationOnce(async () => {
      throw new Error("Board save failed")
    })
    await act(async () => useButton("Chip").click())
    expect(document.querySelector("[role=alert]")?.textContent).toContain(
      "Board save failed",
    )
    expect(useButton("Chip").disabled).toBe(false)
    for (const [label, kind] of [
      ["Chip", "component"],
      ["Simulation circuit", "simulationCircuit"],
      ["Reference circuit", "referenceCircuit"],
    ] as const) {
      await act(async () => useButton(label).click())
      expect(useButton(label).disabled).toBe(true)
      expect(useButton(label).getAttribute("aria-pressed")).toBe("true")
      expect(
        useButton(label).querySelector('svg[aria-label="Added to project"]'),
      ).not.toBeNull()
      expect(added).toHaveBeenLastCalledWith(generatedCircuitAssets, {
        kind,
        generationId: generation.id,
        directory: generation.directory,
        entrypoint: `${generation.directory}/${generatedCircuitAssets[kind]!.filename}`,
      })
    }
    expect(close).not.toHaveBeenCalled()
    const count = added.mock.calls.length
    await act(async () =>
      useButton("Chip").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      ),
    )
    expect(added).toHaveBeenCalledTimes(count)
    await render(model, false)
    await render()
    expect(
      document.querySelectorAll(".ds-use-button[aria-pressed=true]:disabled"),
    ).toHaveLength(3)
    saved.mockImplementationOnce(async () => {
      throw new Error("Disk full")
    })
    await click("Generate")
    await until(() => !!button("Retry save"))
    expect(model.doGenerateCalls).toHaveLength(2)
    const second = saved.mock.calls[1][0]
    expect(second.directory).not.toBe(generation.directory)
    expect(useButton("Chip").disabled).toBe(true)
    await click("Retry save")
    await until(() => !useButton("Chip").disabled)
    expect(saved.mock.calls[2][0].id).toBe(second.id)
    expect(model.doGenerateCalls).toHaveLength(2)
    await act(async () => {
      document
        .querySelector('[role="tab"][aria-selected="true"]')!
        .dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        )
    })
    expect(document.activeElement?.textContent).toBe("Files")
    expect(
      document.querySelector('[aria-label="Generated file list"]')?.textContent,
    ).toContain("generation.json")
    expect(
      document.querySelector('[aria-label="File source"]')?.textContent,
    ).toContain("export default")
    await act(async () => {
      const select = document.querySelector("select")!
      select.value = generation.id
      select.dispatchEvent(new Event("change", { bubbles: true }))
    })
    await click("Components")
    expect(
      document.querySelectorAll(".ds-use-button[aria-pressed=true]:disabled"),
    ).toHaveLength(3)
    let finish!: (value: ReturnType<typeof modelResponse>) => void
    const pending = new MockLanguageModelV4({
      doGenerate: async () => new Promise((resolve) => (finish = resolve)),
    })
    await render(pending)
    await click("Generate")
    await until(() => pending.doGenerateCalls.length === 1)
    await click("Cancel")
    await act(async () => finish(modelResponse(generatedCircuitAssets)))
    expect(saved).toHaveBeenCalledTimes(3)
    expect(button("Generate").disabled).toBe(false)
    await click("Generate")
    await until(() => pending.doGenerateCalls.length === 2)
    await render(pending, false)
    await act(async () => finish(modelResponse(generatedCircuitAssets)))
    await render(pending, true)
    expect(saved).toHaveBeenCalledTimes(3)
    expect(document.querySelectorAll("select option")).toHaveLength(2)
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
  }
})
