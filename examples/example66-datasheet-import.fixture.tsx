import { MockLanguageModelV4 } from "ai/test"
import { useState } from "react"
import { RunFrameAiProvider } from "../lib/ai/RunFrameAiProvider"
import type { DatasheetAssets } from "../lib/ai/datasheet-assets"
import { DatasheetImportDialog } from "../lib/components/DatasheetImportDialog"
import { useStyles } from "../lib/hooks/use-styles"

const demoAssets: DatasheetAssets = {
  partNumber: "DEMO-DIODE",
  packageName: "SOD-123",
  summary:
    "Simulated output for exercising the dialog. These dimensions are example data.",
  footprint: {
    filename: "diode.footprint.tsx",
    content: `export default () => (
  <footprint>
    <smtpad portHints={["1"]} pcbX={-1.65} pcbY={0} width={0.9} height={1.2} shape="rect" />
    <smtpad portHints={["2"]} pcbX={1.65} pcbY={0} width={0.9} height={1.2} shape="rect" />
  </footprint>
)`,
    notes:
      "Example dimensions only. Verify the recommended land pattern before fabrication.",
    sourcePages: [3],
  },
  symbol: {
    filename: "diode.symbol.tsx",
    content: `export default () => (
  <symbol>
    <schematicpath points={[{ x: -0.5, y: -0.5 }, { x: 0.5, y: 0 }, { x: -0.5, y: 0.5 }, { x: -0.5, y: -0.5 }]} />
    <schematicpath points={[{ x: 0.5, y: -0.5 }, { x: 0.5, y: 0.5 }]} />
    <port name="1" pinNumber={1} aliases={["K"]} direction="right" schX={1} schY={0} />
    <port name="2" pinNumber={2} aliases={["A"]} direction="left" schX={-1} schY={0} />
  </symbol>
)`,
    notes: "Review the cathode and anode mapping.",
    sourcePages: [1],
  },
  spiceModel: null,
  component: {
    filename: "diode.tsx",
    content: `import Footprint from "./diode.footprint"
import Symbol from "./diode.symbol"

export default (props: { name: string }) => (
  <chip name={props.name} pinLabels={{ pin1: ["K"], pin2: ["A"] }} footprint={<Footprint />} symbol={<Symbol />} />
)`,
    notes: "Combines the generated footprint and symbol.",
    sourcePages: [1, 3],
  },
  warnings: [
    "SPICE model unavailable: the datasheet does not supply sufficient model parameters.",
  ],
}

// A deterministic SDK test model: this fixture makes no network requests.
const model = new MockLanguageModelV4({
  doGenerate: async () => {
    await new Promise((resolve) => setTimeout(resolve, 600))
    return {
      content: [{ type: "text", text: JSON.stringify(demoAssets) }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: 0, text: 0, reasoning: 0 },
      },
      warnings: [],
    }
  },
})

export default function DatasheetImportFixture() {
  useStyles()
  const [isOpen, setIsOpen] = useState(true)
  const [accepted, setAccepted] = useState<DatasheetAssets | null>(null)
  return (
    <RunFrameAiProvider ai={{ model }}>
      <div className="rf-p-8 rf-space-y-4">
        <h1 className="rf-text-xl rf-font-semibold">Create from datasheet</h1>
        <p className="rf-text-sm rf-text-zinc-500">
          Demo model with simulated results. Upload any PDF to exercise the
          flow.
        </p>
        <button
          type="button"
          className="rf-rounded rf-bg-blue-600 rf-px-4 rf-py-2 rf-text-white"
          onClick={() => setIsOpen(true)}
        >
          Open datasheet dialog
        </button>
        {accepted && (
          <output>Accepted generated files for {accepted.partNumber}</output>
        )}
      </div>
      <DatasheetImportDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAssetsGenerated={setAccepted}
      />
    </RunFrameAiProvider>
  )
}
