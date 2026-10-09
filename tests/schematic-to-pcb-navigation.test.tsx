import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act, createContext, useContext, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { usePcbViewerController } from "@tscircuit/pcb-viewer"
import { useSchematicViewerController } from "@tscircuit/schematic-viewer/source"

const Empty = () => null
mock.module("posthog-js", () => ({
  default: { capture: () => {}, identify: () => {}, init: () => {} },
}))
const TabsContext = createContext({
  value: "",
  onValueChange: (_: string) => {},
})
mock.module("lib/components/ui/tabs", () => ({
  Tabs: ({ value, onValueChange, children }: any) => (
    <TabsContext.Provider value={{ value, onValueChange }}>
      {children}
    </TabsContext.Provider>
  ),
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ value, children }: any) => {
    const tabs = useContext(TabsContext)
    return <button onClick={() => tabs.onValueChange(value)}>{children}</button>
  },
  TabsContent: ({ value, children }: any) =>
    useContext(TabsContext).value === value ? (
      <div data-active-tab={value}>{children}</div>
    ) : null,
}))
mock.module("@tscircuit/schematic-viewer/source", () => ({
  useSchematicViewerController,
  AnalogSimulationViewer: Empty,
  SchematicViewer: ({ onViewPcbComponent }: any) =>
    onViewPcbComponent ? (
      <button
        onClick={() =>
          onViewPcbComponent({
            source_component_id: "source_1",
            pcb_component_id: "stale_id",
            schematic_component_id: "schematic_1",
            refdes: "U1",
          })
        }
      >
        Show on PCB
      </button>
    ) : (
      <div>Schematic without PCB navigation</div>
    ),
}))
const PcbViewer = ({ controller }: any) => {
  const [target, setTarget] = useState<string>()
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!controller.focusRequest) return
    setTarget(controller.focusRequest.pcbComponentId)
    setCount((value) => value + 1)
    controller.onFocusRequestHandled(controller.focusRequest)
  }, [controller])
  return <div data-pcb-focus-target={target} data-focus-count={count} />
}
mock.module("@tscircuit/pcb-viewer", () => ({
  usePcbViewerController,
  PCBViewer: PcbViewer,
}))
mock.module("lib/components/PcbViewerWithContainerHeight", () => ({
  PcbViewerWithContainerHeight: PcbViewer,
}))
mock.module("@tscircuit/3d-viewer", () => ({ CadViewer: Empty }))
mock.module("@tscircuit/assembly-viewer", () => ({
  AssemblyViewer: Empty,
  PinoutViewer: Empty,
}))
for (const [module, name] of [
  ["ErrorFallback", "ErrorFallback"],
  ["ErrorTabContent/ErrorTabContent", "ErrorTabContent"],
  ["CircuitJsonTableViewer/CircuitJsonTableViewer", "CircuitJsonTableViewer"],
  ["BomTable", "BomTable"],
  ["RenderLogViewer/RenderLogViewer", "RenderLogViewer"],
  ["SolversTabContent/SolversTabContent", "SolversTabContent"],
  ["AutoroutingTabContent/AutoroutingTabContent", "AutoroutingTabContent"],
  ["FileMenuLeftHeader", "FileMenuLeftHeader"],
])
  mock.module(`lib/components/${module}`, () => ({ [name!]: Empty }))
mock.module("lib/components/PreviewEmptyState", () => ({ default: Empty }))
mock.module("lib/components/CircuitJsonPreview/CrispFeedbackButton", () => ({
  CrispFeedbackButton: Empty,
  shouldShowCrispFeedbackButton: () => false,
}))
for (const [path, hook] of [
  ["use-styles", "useStyles"],
  ["use-fullscreen-body-scroll", "useFullscreenBodyScroll"],
  ["use-error-telemetry", "useErrorTelemetry"],
  ["use-posthog-activity", "usePostHogActivity"],
]) {
  mock.module(`lib/hooks/${path}`, () => ({ [hook!]: () => {} }))
}
mock.module("lib/hooks/use-eval-versions", () => ({
  useEvalVersions: () => ({
    versions: [],
    search: "",
    setSearch: () => {},
    selectVersion: () => {},
  }),
}))

test("schematic navigation queues PCB focus, switches tabs, and honors unavailable destinations", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost" })
  const globals = [
    "window",
    "document",
    "Element",
    "HTMLElement",
    "Node",
    "Event",
    "MouseEvent",
    "MutationObserver",
    "getComputedStyle",
  ] as const
  const previous = Object.fromEntries(
    globals.map((key) => [key, globalThis[key]]),
  )
  Object.assign(
    globalThis,
    Object.fromEntries(globals.map((key) => [key, dom.window[key]])),
    { IS_REACT_ACT_ENVIRONMENT: true },
  )
  const root = createRoot(document.getElementById("root")!)
  const { CircuitJsonPreview } = await import(
    "../lib/components/CircuitJsonPreview/CircuitJsonPreview"
  )
  const changes: string[] = []
  const circuitJson = [
    { type: "schematic_group", schematic_group_id: "group_1" },
    {
      type: "schematic_component",
      schematic_component_id: "schematic_1",
      source_component_id: "source_1",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_1",
      source_component_id: "source_1",
    },
  ] as any
  const render = async (
    tabs = ["schematic", "pcb"],
    elements = circuitJson,
  ) => {
    await act(async () =>
      root.render(
        <CircuitJsonPreview
          circuitJson={elements}
          availableTabs={tabs as any}
          defaultActiveTab="schematic"
          showRightHeaderContent={true}
          allowSelectingVersion={false}
          onActiveTabChange={(tab) => changes.push(tab)}
        />,
      ),
    )
  }
  const click = async (label: string) => {
    const button = Array.from(document.querySelectorAll("button")).find(
      (element) => element.textContent === label,
    )!
    expect(button).toBeDefined()
    await act(async () =>
      button.dispatchEvent(
        new dom.window.MouseEvent("click", { bubbles: true }),
      ),
    )
  }
  try {
    await render()
    await click("Show on PCB")
    expect(document.querySelector('[data-active-tab="pcb"]')).not.toBeNull()
    expect(
      document.querySelector('[data-pcb-focus-target="pcb_1"]'),
    ).not.toBeNull()
    expect(changes).toEqual(["pcb"])
    await click("Schematic")
    await click("Show on PCB")
    expect(
      document.querySelector('[data-pcb-focus-target="pcb_1"]'),
    ).not.toBeNull()
    await click("Schematic")
    const changeCount = changes.length
    // A hidden PCB tab must not expose the callback in the schematic viewer.
    await render(["schematic"])
    expect(document.body.textContent).not.toContain("Show on PCB")
    expect(
      document.querySelector('[data-active-tab="schematic"]'),
    ).not.toBeNull()
    expect(changes).toHaveLength(changeCount)
    // If the component disappeared since the menu opened, do not navigate.
    await render(
      ["schematic", "pcb"],
      circuitJson.filter((element: any) => element.type !== "pcb_component"),
    )
    await click("Show on PCB")
    expect(
      document.querySelector('[data-active-tab="schematic"]'),
    ).not.toBeNull()
    expect(changes).toHaveLength(changeCount)
  } finally {
    await act(async () => root.unmount())
    Object.assign(globalThis, previous, { IS_REACT_ACT_ENVIRONMENT: false })
    dom.window.close()
  }
})
