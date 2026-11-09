import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import type { ReferenceDesign } from "../../lib/reference-designs"
import type { ReferenceDesignArtifacts } from "../../lib/components/ReferenceDesignViewer/ReferenceDesignViewer"

mock.module("../../lib/hooks/use-styles", () => ({ useStyles: () => {} }))

mock.module(
  "../../lib/components/CircuitJsonPreview/CircuitJsonPreview",
  () => ({
    CircuitJsonPreview: ({
      circuitJson,
      leftHeaderContent,
    }: { circuitJson: unknown; leftHeaderContent: React.ReactNode }) => (
      <div>
        {leftHeaderContent}
        <output>{JSON.stringify(circuitJson)}</output>
      </div>
    ),
  }),
)

test("only the most recently selected prebuilt configuration reaches the preview", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost" })
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  })
  const { ReferenceDesignViewer } = await import(
    "../../lib/components/ReferenceDesignViewer/ReferenceDesignViewer"
  )
  const configurations = ["full_board", "minimal_board"].map((name) => ({
    name,
    display_name: name,
    props: {},
    circuit_json_path: `dist/${name}/circuit.json`,
    glb_path: `dist/${name}/3d.glb`,
    pcb_svg_path: `dist/${name}/pcb.svg`,
    schematic_svg_path: `dist/${name}/schematic.svg`,
    circuit_json_sha256: "0".repeat(64),
    glb_sha256: "0".repeat(64),
  }))
  const referenceDesign: ReferenceDesign = {
    name: "timer",
    display_name: "Timer",
    chip_names: ["NE555DR"],
    component_path: "index.circuit.tsx",
    props_schema: {},
    configurations,
  }
  const completions: Array<(artifacts: ReferenceDesignArtifacts) => void> = []
  const signals: AbortSignal[] = []
  const loadConfiguration = mock(({ signal }: { signal: AbortSignal }) => {
    signals.push(signal)
    return new Promise<ReferenceDesignArtifacts>((resolve) =>
      completions.push(resolve),
    )
  })
  const root = createRoot(document.getElementById("root")!)
  try {
    await act(async () =>
      root.render(
        <ReferenceDesignViewer
          referenceDesign={referenceDesign}
          loadConfiguration={loadConfiguration}
        />,
      ),
    )
    const select = document.querySelector("select")!
    await act(async () => {
      select.value = "minimal_board"
      select.dispatchEvent(new dom.window.Event("change", { bubbles: true }))
    })
    expect(signals[0].aborted).toBe(true)
    await act(async () =>
      completions[1]({ circuitJson: [], glbData: new ArrayBuffer(0) }),
    )
    await act(async () =>
      completions[0]({
        circuitJson: [
          {
            type: "pcb_board",
            pcb_board_id: "old",
            center: { x: 0, y: 0 },
            width: 20,
            height: 20,
            num_layers: 2,
            thickness: 1.6,
          },
        ],
        glbData: new ArrayBuffer(0),
      }),
    )
    expect(document.querySelector("output")?.textContent).toBe("[]")
    expect(document.querySelector("select")?.value).toBe("minimal_board")
    expect(loadConfiguration).toHaveBeenCalledTimes(2)
  } finally {
    await act(async () => root.unmount())
    Object.assign(globalThis, {
      window: previousWindow,
      document: previousDocument,
    })
    dom.window.close()
  }
})
