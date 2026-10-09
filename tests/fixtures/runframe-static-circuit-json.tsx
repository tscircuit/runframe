import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"

const createWorker = mock(async () => {
  throw new Error("Static Circuit JSON must not create an eval worker")
})
mock.module("@tscircuit/eval/worker", () => ({
  createCircuitWebWorker: createWorker,
}))
mock.module("posthog-js", () => ({
  default: {
    init: () => {},
    capture: () => {},
    identify: () => {},
    captureException: () => {},
  },
}))
mock.module("lib/components/CircuitJsonPreview/CircuitJsonPreview", () => ({
  CircuitJsonPreview: ({ circuitJson, errorMessage }: any) => (
    <div>
      <output>{errorMessage ?? "No errors or warnings"}</output>
      <pre data-circuit-json>{JSON.stringify(circuitJson)}</pre>
    </div>
  ),
}))

test("static files emit lifecycle callbacks once per source and recover parse failures without a worker", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "http://localhost",
    pretendToBeVisual: true,
  })
  const globals = [
    "window",
    "document",
    "Element",
    "HTMLElement",
    "Node",
    "Event",
    "MouseEvent",
    "KeyboardEvent",
    "MutationObserver",
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "IS_REACT_ACT_ENVIRONMENT",
  ] as const
  const previous = Object.fromEntries(
    globals.map((key) => [key, (globalThis as any)[key]]),
  )
  const previousFetch = globalThis.fetch
  const previousWorker = globalThis.runFrameWorker
  Object.assign(
    globalThis,
    Object.fromEntries(globals.map((key) => [key, (dom.window as any)[key]])),
    { IS_REACT_ACT_ENVIRONMENT: true, runFrameWorker: undefined },
  )
  const network = mock(() => {
    throw new Error("Static files must not discover eval versions")
  })
  globalThis.fetch = network as unknown as typeof fetch
  ;(dom.window as any).fetch = globalThis.fetch
  const root = createRoot(document.getElementById("root")!)
  try {
    const { RunFrame } = await import("../../lib/components/RunFrame/RunFrame")
    const events: string[] = []
    const changed = mock((_json: unknown) => events.push("changed"))
    const completed = mock((_payload: unknown) => events.push("completed"))
    const error = mock((_error: Error) => events.push("error"))
    const successfulLifecycle = [
      "started",
      "changed",
      "initial",
      "completed",
      "finished",
    ]
    const render = (
      source: string,
      isLoadingFiles = false,
      fsMap: Record<string, string> | Map<string, string> = {
        "board.circuit.json": source,
      },
    ) => (
      <RunFrame
        fsMap={fsMap}
        mainComponentPath="board.circuit.json"
        isLoadingFiles={isLoadingFiles}
        showFileMenu={false}
        onRenderStarted={() => events.push("started")}
        onCircuitJsonChange={changed}
        onInitialRender={() => events.push("initial")}
        onRunCompleted={completed}
        onRenderFinished={() => events.push("finished")}
        onError={error}
      />
    )

    await act(async () => root.render(render("[]", true)))
    expect(events).toEqual([])
    await act(async () => root.render(render("[]")))
    expect(events).toEqual(successfulLifecycle)
    expect(changed).toHaveBeenLastCalledWith([])
    expect(completed).toHaveBeenLastCalledWith({ hasExecutionError: false })
    expect(document.querySelector("[data-circuit-json]")?.textContent).toBe(
      "[]",
    )

    await act(async () =>
      root.render(
        render("[]", false, {
          "board.circuit.json": "[]",
          "unrelated.tsx": "export default () => null",
        }),
      ),
    )
    await act(async () =>
      root.render(render("[]", false, new Map([["board.circuit.json", "[]"]]))),
    )
    expect(events).toEqual(successfulLifecycle)

    const shortcut = new KeyboardEvent("keydown", {
      key: "Enter",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })
    await act(async () => window.dispatchEvent(shortcut))
    expect(shortcut.defaultPrevented).toBe(false)
    expect(events).toEqual(successfulLifecycle)

    await act(async () => root.render(render("[]\n", true)))
    expect(completed).toHaveBeenCalledTimes(1)
    await act(async () => root.render(render("[]\n")))
    expect(events).toEqual([...successfulLifecycle, ...successfulLifecycle])

    await act(async () => root.render(render("[")))
    expect(error).toHaveBeenCalledTimes(1)
    expect(error.mock.calls[0]![0].message).toContain(
      "Failed to parse circuit.json",
    )
    expect(completed.mock.calls.at(-1)?.[0]).toMatchObject({
      hasExecutionError: true,
      errors: [{ message: error.mock.calls[0]![0].message }],
    })
    expect(events.slice(-2)).toEqual(["error", "completed"])
    expect(document.querySelector("[data-circuit-json]")?.textContent).toBe(
      "null",
    )
    await act(async () => root.render(render("[")))
    expect(error).toHaveBeenCalledTimes(1)
    expect(completed).toHaveBeenCalledTimes(3)

    await act(async () => root.render(render("[]")))
    expect(events.slice(-5)).toEqual(successfulLifecycle)
    expect(completed).toHaveBeenCalledTimes(4)
    expect(document.querySelector("[data-circuit-json]")?.textContent).toBe(
      "[]",
    )
    expect(document.body.textContent).not.toContain("Failed to parse")
    expect(createWorker).not.toHaveBeenCalled()
    expect(network).not.toHaveBeenCalled()
  } finally {
    await act(async () => root.unmount())
    globalThis.fetch = previousFetch
    Object.assign(globalThis, previous, { runFrameWorker: previousWorker })
    dom.window.close()
  }
})
