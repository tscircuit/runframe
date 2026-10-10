import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"

const telemetry = {
  __loaded: false,
  init: mock(() => {
    telemetry.__loaded = true
  }),
  identify: mock(() => {}),
  capture: mock(() => {}),
  captureException: mock(() => {}),
}
mock.module("posthog-js", () => ({ default: telemetry }))

const createBrowser = () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "https://viewer.example.test",
    pretendToBeVisual: true,
  })
  const names = [
    "window",
    "document",
    "location",
    "localStorage",
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
  ]
  for (const name of names) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value: (dom.window as any)[name],
    })
  }
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  return dom
}

test("telemetry can be disabled before import and suppressed for an existing SDK", async () => {
  const dom = createBrowser()
  window.TSCIRCUIT_TELEMETRY_DISABLED = true
  const { initPostHog, captureRunFrameActivity } = await import(
    "../../lib/utils/posthog"
  )
  expect(telemetry.init).not.toHaveBeenCalled()
  expect(initPostHog()).toBe(false)

  const { useErrorTelemetry } = await import(
    "../../lib/hooks/use-error-telemetry"
  )
  const Probe = ({ message }: { message: string }) => {
    useErrorTelemetry({
      errorMessage: message,
      errorStack: "Error: authored circuit failed",
      circuitJsonErrors: [{ type: "pcb_error", message }] as any,
    })
    return null
  }
  const root = createRoot(document.getElementById("root")!)
  try {
    await act(async () => root.render(<Probe message="before SDK load" />))
    captureRunFrameActivity({ source: "runframe", component: "RunFrame" })
    expect(telemetry.init).not.toHaveBeenCalled()
    expect(telemetry.identify).not.toHaveBeenCalled()
    expect(telemetry.capture).not.toHaveBeenCalled()
    expect(telemetry.captureException).not.toHaveBeenCalled()

    telemetry.__loaded = true
    expect(initPostHog()).toBe(false)
    await act(async () => root.render(<Probe message="with an existing SDK" />))
    captureRunFrameActivity({ source: "runframe", component: "RunFrame" })
    expect(telemetry.identify).not.toHaveBeenCalled()
    expect(telemetry.capture).not.toHaveBeenCalled()
    expect(telemetry.captureException).not.toHaveBeenCalled()

    delete window.TSCIRCUIT_TELEMETRY_DISABLED
    telemetry.__loaded = false
    expect(initPostHog()).toBe(true)
    expect(telemetry.init).toHaveBeenCalledTimes(1)
    captureRunFrameActivity({ source: "runframe", component: "RunFrame" })
    await act(async () => root.render(<Probe message="ordinary defaults" />))
    expect(telemetry.capture).toHaveBeenCalledTimes(1)
    expect(telemetry.captureException).toHaveBeenCalledTimes(2)
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
  }
})

test("the injected version selector default preserves explicit prop precedence", async () => {
  const dom = createBrowser()
  window.TSCIRCUIT_TELEMETRY_DISABLED = true
  window.TSCIRCUIT_ALLOW_SELECTING_EVAL_VERSION = false
  const network = mock(
    async (_input: RequestInfo | URL) => new Response('{"versions":[]}'),
  )
  const previousFetch = globalThis.fetch
  globalThis.fetch = network as unknown as typeof fetch
  const { CircuitJsonPreview } = await import(
    "../../lib/components/CircuitJsonPreview/CircuitJsonPreview"
  )
  try {
    const scenarios = [
      { injected: false, explicit: undefined, requests: 0 },
      { injected: false, explicit: true, requests: 1 },
      { injected: true, explicit: false, requests: 0 },
      { injected: true, explicit: undefined, requests: 1 },
      { injected: undefined, explicit: undefined, requests: 1 },
    ]
    for (const { injected, explicit, requests } of scenarios) {
      if (injected === undefined) {
        delete window.TSCIRCUIT_ALLOW_SELECTING_EVAL_VERSION
      } else {
        window.TSCIRCUIT_ALLOW_SELECTING_EVAL_VERSION = injected
      }
      network.mockClear()
      const root = createRoot(document.getElementById("root")!)
      try {
        await act(async () =>
          root.render(
            <CircuitJsonPreview
              circuitJson={null}
              allowSelectingVersion={explicit}
              availableTabs={["errors"]}
              defaultActiveTab="errors"
            />,
          ),
        )
        expect(network).toHaveBeenCalledTimes(requests)
        if (requests) {
          expect(network.mock.calls[0]?.[0]).toBe(
            "https://data.jsdelivr.com/v1/package/npm/@tscircuit/eval",
          )
        }
      } finally {
        await act(async () => root.unmount())
      }
    }
  } finally {
    globalThis.fetch = previousFetch
    dom.window.close()
  }
})
