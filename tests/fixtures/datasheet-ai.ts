import { MockLanguageModelV4 } from "ai/test"
import type { DatasheetAssets } from "../../lib/ai/datasheet-assets"

export const generatedAssets: DatasheetAssets = {
  partNumber: "TEST123",
  packageName: "SOIC-8",
  summary: "Draft assets from the supplied datasheet.",
  footprint: {
    filename: "test123.footprint.tsx",
    content:
      'export default () => <footprint><smtpad portHints={["1"]} pcbX={0} pcbY={0} width={1} height={1} shape="rect" /></footprint>',
    notes: "Check pad dimensions against the land pattern.",
    sourcePages: [3],
  },
  symbol: {
    filename: "test123.symbol.tsx",
    content:
      'export default () => <symbol><port name="1" pinNumber={1} schX={0} schY={0} direction="left" /></symbol>',
    notes: "Check the pin map.",
    sourcePages: [2],
  },
  spiceModel: null,
  component: null,
  simulationCircuit: null,
  referenceCircuit: null,
  warnings: [
    "The datasheet does not provide enough parameters for a SPICE model.",
  ],
}

export const generatedCircuitAssets: DatasheetAssets = {
  ...generatedAssets,
  component: {
    filename: "test123.component.tsx",
    content: "export default (props) => <chip {...props} />",
    notes: "Standalone chip, without simulation enabled.",
    sourcePages: [2],
  },
  spiceModel: {
    filename: "test123.lib",
    content: ".SUBCKT TEST123 1 2\nR1 1 2 1k\n.ENDS TEST123",
    notes: "Behavioral approximation.",
    sourcePages: [2],
  },
  simulationCircuit: {
    filename: "test123.simulation.tsx",
    content:
      'export default () => <group subcircuit><analogsimulation duration="1ms" /></group>',
    notes: "Connected simulation testbench.",
    sourcePages: [4],
  },
  referenceCircuit: {
    filename: "test123.reference.tsx",
    content:
      'export default () => <group subcircuit><resistor name="R1" resistance="1k" /></group>',
    notes: "Reference application without analysis or sources.",
    sourcePages: [4],
  },
}

export const providerAssets = (value: unknown = generatedAssets) =>
  value && typeof value === "object"
    ? { simulationCircuit: null, referenceCircuit: null, ...value }
    : value

export const modelResponse = (value: unknown = generatedAssets) => ({
  content: [
    { type: "text" as const, text: JSON.stringify(providerAssets(value)) },
  ],
  finishReason: { unified: "stop" as const, raw: undefined },
  usage: {
    inputTokens: { total: 100, noCache: 100, cacheRead: 0, cacheWrite: 0 },
    outputTokens: { total: 100, text: 100, reasoning: 0 },
  },
  warnings: [],
})

export const createDatasheetModel = (value: unknown = generatedAssets) =>
  new MockLanguageModelV4({ doGenerate: modelResponse(value) })

export const pdfFile = () =>
  new File(["%PDF-1.7\nsynthetic test datasheet"], "test123.pdf", {
    type: "application/pdf",
  })
