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
  warnings: [
    "The datasheet does not provide enough parameters for a SPICE model.",
  ],
}

export const ambiguousAssets = {
  partNumber: "LM158/LM258/LM358/LM2904 family",
  packageName: "Multiple packages",
  summary:
    "The datasheet covers multiple electrical variants and pin mappings.",
  footprint: null,
  symbol: null,
  spiceModel: null,
  component: null,
  warnings: [],
  clarification: {
    question: "Which electrical variant and package do you want to create?",
    options: [
      {
        partNumber: "LM358",
        packageName: "D (SOIC-8)",
        description: "Original dual amplifier in the 8-pin SOIC package.",
        sourcePages: [1, 3, 10],
      },
      {
        partNumber: "LM358B",
        packageName: "D (SOIC-8)",
        description: "B variant, with different electrical specifications.",
        sourcePages: [1, 3, 6],
      },
    ],
  },
}

export const providerAssets = (value: unknown = generatedAssets) =>
  value && typeof value === "object" ? { clarification: null, ...value } : value

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
