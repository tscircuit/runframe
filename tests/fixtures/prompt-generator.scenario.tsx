import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import type {
  RunFrameAi,
  RunFrameAiRequest,
} from "../../lib/ai/RunFrameAiProvider"

mock.module("posthog-js", () => ({
  default: { init() {}, identify() {}, capture() {}, captureException() {} },
}))

test("reviewed prompts and original PDFs reach only the requested adapter", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "https://host.example",
    pretendToBeVisual: true,
  })
  const keys = [
    "window",
    "document",
    "location",
    "localStorage",
    "Element",
    "HTMLElement",
    "HTMLInputElement",
    "HTMLTextAreaElement",
    "HTMLSelectElement",
    "HTMLButtonElement",
    "DocumentFragment",
    "Node",
    "Event",
    "CustomEvent",
    "NodeFilter",
    "MouseEvent",
    "MutationObserver",
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "navigator",
  ]
  for (const key of keys)
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value: Reflect.get(dom.window, key),
    })
  Object.assign(globalThis, {
    IS_REACT_ACT_ENVIRONMENT: true,
    ResizeObserver: class {
      observe() {}
      disconnect() {}
    },
  })
  const copied = mock(async (_text: string) => {})
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: copied },
  })
  const { createRoot } = await import("react-dom/client")
  const { RunFrame } = await import("../../lib/components/RunFrame/RunFrame")
  const root = createRoot(document.getElementById("root")!)
  let finish: (text: string) => void = () => {}
  let fail: (error: Error) => void = () => {}
  const requests: RunFrameAiRequest[] = []
  const generate = mock((request: RunFrameAiRequest) => {
    requests.push(request)
    return new Promise<string>((resolve, reject) => {
      finish = resolve
      fail = reject
    })
  })
  const ai: RunFrameAi = { generate }
  const render = (adapter?: RunFrameAi, showPromptGenerator?: boolean) => (
    <RunFrame
      fsMap={{ "board.circuit.json": "[]" }}
      mainComponentPath="board.circuit.json"
      availableTabs={["circuit_json"]}
      showFileMenu={false}
      ai={adapter}
      showPromptGenerator={showPromptGenerator}
    />
  )
  const button = (text: string) => {
    const found = Array.from(document.querySelectorAll("button")).find(
      (element) => element.textContent === text,
    )
    expect(found, text).toBeDefined()
    return found!
  }
  const click = async (text: string) => {
    await act(async () => button(text).click())
  }
  try {
    await act(async () => root.render(render()))
    expect(document.body.textContent).not.toContain("Prompt generator")
    await act(async () => root.render(render(undefined, true)))
    await click("Prompt generator")
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
    expect(document.body.textContent).not.toContain("Send to AI")
    await click("Copy prompt")
    expect(copied).toHaveBeenCalledTimes(1)
    await click("Close")

    await act(async () => root.render(render(ai)))
    await click("Prompt generator")
    expect(generate).not.toHaveBeenCalled()
    const pdf = new File(["%PDF-1.7\nLM358 original bytes"], "lm358.pdf", {
      type: "application/pdf",
    })
    const upload = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    Object.defineProperty(upload, "files", { configurable: true, value: [pdf] })
    await act(async () =>
      upload.dispatchEvent(new Event("change", { bubbles: true })),
    )
    expect(document.body.textContent).toContain("attach the PDF separately")
    const input = document.querySelectorAll("textarea")[1]
    const exactPrompt = `${input.value}\nCustom requirement: test the LM358 at 5 V.`
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )!.set!.call(input, exactPrompt)
      input.dispatchEvent(new Event("input", { bubbles: true }))
    })
    await act(async () =>
      (
        document.querySelectorAll(
          'input[type="checkbox"]',
        )[2] as HTMLInputElement
      ).click(),
    )
    expect(input.value).toBe(exactPrompt)
    expect(document.body.textContent).toContain("your edits are preserved")
    await click("Send to AI")
    expect(requests[0].prompt).toBe(exactPrompt)
    expect(requests[0].attachments[0]).toBe(pdf)
    expect(await requests[0].attachments[0].text()).toBe(await pdf.text())
    expect(document.body.textContent).toContain("Waiting for AI")
    await click("Cancel request")
    expect(requests[0].signal.aborted).toBe(true)
    await act(async () => finish("STALE RESPONSE"))
    expect(document.body.textContent).not.toContain("STALE RESPONSE")

    await click("Send to AI")
    await act(async () =>
      finish("Review <script>unsafe()</script> as plain text"),
    )
    expect(document.querySelector("pre")?.textContent).toContain(
      "<script>unsafe()</script>",
    )
    expect(document.querySelector("script")).toBeNull()
    await click("Send to AI")
    await act(async () => fail(new Error("Provider unavailable")))
    expect(document.querySelector('[role="alert"]')?.textContent).toBe(
      "Provider unavailable",
    )
    await click("Send to AI")
    await click("Close")
    expect(requests.at(-1)!.signal.aborted).toBe(true)
    await act(async () => finish("CLOSED RESPONSE"))
    await click("Prompt generator")
    expect(document.body.textContent).not.toContain("CLOSED RESPONSE")
    await click("Send to AI")
    await act(async () =>
      root.render(render({ generate: async () => "new adapter" })),
    )
    expect(requests.at(-1)!.signal.aborted).toBe(true)
    await act(async () => finish("OLD ADAPTER RESPONSE"))
    expect(document.body.textContent).not.toContain("OLD ADAPTER RESPONSE")
    await act(async () => root.render(render(ai)))
    await click("Send to AI")
    await act(async () => root.unmount())
    expect(requests.at(-1)!.signal.aborted).toBe(true)
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
  }
})
