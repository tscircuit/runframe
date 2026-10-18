import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import type { ExtraRunFrameTab } from "../../lib/components/CircuitJsonPreview/extra-runframe-tabs"

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

test("iframe navigation survives tab switches, updates replace source, and removed tabs recover", async () => {
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
    const { Tabs } = await import("../../lib/components/ui/tabs")
    const { ExtraIframeTabContent } = await import(
      "../../lib/components/CircuitJsonPreview/ExtraIframeTabContent"
    )
    const tab = {
      id: "extra:Sysconfig" as const,
      tabName: "Sysconfig",
      iframeUrl: "https://viewer.example/#first",
    }
    const renderPanel = (active: boolean, iframeUrl = tab.iframeUrl) => (
      <Tabs value={active ? tab.id : "pcb"}>
        <ExtraIframeTabContent active={active} tab={{ ...tab, iframeUrl }} />
      </Tabs>
    )
    await act(async () => root.render(renderPanel(false)))
    expect(document.querySelector("iframe")).toBeNull()
    await act(async () => root.render(renderPanel(true)))
    const iframe = document.querySelector("iframe")!
    expect(iframe.title).toBe("Sysconfig")
    expect(iframe.sandbox?.value ?? iframe.getAttribute("sandbox")).toBe(
      "allow-scripts allow-same-origin",
    )
    iframe.dataset.navigationState = "GPIO-expanded"
    await act(async () => root.render(renderPanel(false)))
    expect(document.querySelector("iframe")).toBe(iframe)
    expect(iframe.parentElement?.style.display).toBe("none")
    await act(async () => root.render(renderPanel(true)))
    expect(document.querySelector("iframe")).toBe(iframe)
    expect(iframe.dataset.navigationState).toBe("GPIO-expanded")
    await act(async () =>
      root.render(renderPanel(true, "https://viewer.example/#second")),
    )
    expect(iframe.src).toBe("https://viewer.example/#second")

    const { CircuitJsonPreview } = await import(
      "../../lib/components/CircuitJsonPreview/CircuitJsonPreview"
    )
    localStorage.setItem("runframe-active-tab", JSON.stringify(tab.id))
    const preview = (extraTabs: ExtraRunFrameTab[]) => (
      <CircuitJsonPreview
        circuitJson={null}
        extraTabs={extraTabs}
        allowSelectingVersion={false}
        showToggleFullScreen={false}
      />
    )
    await act(async () => root.render(preview([tab])))
    expect(document.querySelector('iframe[title="Sysconfig"]')).not.toBeNull()
    expect(
      document.querySelector('[role="tab"][data-state="active"]')?.textContent,
    ).toBe("Sysconfig")
    await act(async () => root.render(preview([])))
    expect(document.querySelector("iframe")).toBeNull()
    expect(
      document.querySelector('[role="tab"][data-state="active"]')?.textContent,
    ).toBe("PCB")
    expect(JSON.parse(localStorage.getItem("runframe-active-tab")!)).toBe("pcb")

    const { useExtraRunFrameTabsFromWindow, EXTRA_RUNFRAME_TABS_CHANGE_EVENT } =
      await import("../../lib/hooks/use-extra-runframe-tabs-from-window")
    const BootstrapProbe = () => (
      <output>{JSON.stringify(useExtraRunFrameTabsFromWindow())}</output>
    )
    window.TSCIRCUIT_EXTRA_RUNFRAME_TABS = [tab]
    await act(async () => root.render(<BootstrapProbe />))
    expect(JSON.parse(document.querySelector("output")!.textContent!)).toEqual([
      tab,
    ])
    window.TSCIRCUIT_EXTRA_RUNFRAME_TABS = []
    await act(async () =>
      window.dispatchEvent(new Event(EXTRA_RUNFRAME_TABS_CHANGE_EVENT)),
    )
    expect(document.querySelector("output")!.textContent).toBe("[]")

    const { RunFrameWithIframe } = await import(
      "../../lib/components/RunFrameWithIframe/RunFrameWithIframe"
    )
    const iframeFsMap = {}
    const iframeTabs = [tab]
    await act(async () =>
      root.render(
        <RunFrameWithIframe
          fsMap={iframeFsMap}
          iframeUrl="https://runner.example/iframe.html"
          extraTabs={iframeTabs}
        />,
      ),
    )
    const child = document.querySelector("iframe")!.contentWindow!
    const sent: Array<{
      message: unknown
      origin: string | WindowPostMessageOptions | undefined
    }> = []
    child.postMessage = (
      message: unknown,
      origin?: string | WindowPostMessageOptions,
    ) => {
      sent.push({ message, origin })
    }
    const ready = { runframe_type: "runframe_ready_to_receive" }
    await act(async () =>
      window.dispatchEvent(
        new dom.window.MessageEvent("message", {
          data: ready,
          source: window,
          origin: "https://runner.example",
        }),
      ),
    )
    expect(sent).toHaveLength(0)
    await act(async () =>
      window.dispatchEvent(
        new dom.window.MessageEvent("message", {
          data: ready,
          source: child,
          origin: "https://runner.example",
        }),
      ),
    )
    expect(sent.at(-1)).toEqual({
      message: {
        runframe_type: "runframe_props_changed",
        runframe_props: { fsMap: {}, extraTabs: [tab] },
      },
      origin: "https://runner.example",
    })
    const sentCount = sent.length
    await act(async () =>
      root.render(
        <RunFrameWithIframe
          fsMap={iframeFsMap}
          iframeUrl="https://runner.example/iframe.html"
          extraTabs={iframeTabs}
        />,
      ),
    )
    expect(sent).toHaveLength(sentCount)
    await act(async () =>
      root.render(
        <RunFrameWithIframe
          fsMap={iframeFsMap}
          iframeUrl="https://runner.example/iframe.html"
          extraTabs={[]}
        />,
      ),
    )
    expect(sent.at(-1)).toEqual({
      message: {
        runframe_type: "runframe_props_changed",
        runframe_props: { fsMap: {}, extraTabs: [] },
      },
      origin: "https://runner.example",
    })
    child.postMessage = (message: unknown) => {
      structuredClone(message)
    }
    await act(async () =>
      root.render(
        <RunFrameWithIframe
          fsMap={iframeFsMap}
          iframeUrl="https://runner.example/iframe.html"
          onError={() => {}}
        />,
      ),
    )
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "structured-cloneable",
    )
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
  }
})
