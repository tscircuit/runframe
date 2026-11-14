import { z } from "zod"

const filename = z.string().max(120)

const asset = z.object({
  filename,
  content: z.string().min(1).max(500_000),
  notes: z.string().max(4_000),
  sourcePages: z.array(z.number().int().positive()).max(100),
})

// A single pattern preserves basename and extension checks without emitting
// allOf, which OpenAI Structured Outputs does not support.
const tsxAsset = asset.extend({
  filename: filename.regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.tsx$/),
})
const spiceAsset = asset.extend({
  filename: filename.regex(
    /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(cir|spice|lib|subckt)$/,
  ),
})

export const datasheetAssetsSchema = z.object({
  partNumber: z.string().min(1).max(200),
  packageName: z.string().max(200),
  summary: z.string().max(4_000),
  footprint: tsxAsset.nullable(),
  symbol: tsxAsset.nullable(),
  spiceModel: spiceAsset.nullable(),
  component: tsxAsset.nullable(),
  simulationCircuit: tsxAsset.nullable(),
  referenceCircuit: tsxAsset.nullable(),
  warnings: z.array(z.string().max(4_000)).max(50),
})

export type DatasheetUsageKind =
  | "component"
  | "simulationCircuit"
  | "referenceCircuit"

export interface DatasheetAssetSelection {
  kind: DatasheetUsageKind
  entrypoint: string
}

export type DatasheetAssets = z.infer<typeof datasheetAssetsSchema>
export type DatasheetAsset = z.infer<typeof asset>
export type DatasheetAssetKind =
  | "footprint"
  | "symbol"
  | "spiceModel"
  | "component"
  | "simulationCircuit"
  | "referenceCircuit"

export const datasheetAssetLabels: Record<DatasheetAssetKind, string> = {
  footprint: "Footprint",
  symbol: "Symbol",
  spiceModel: "SPICE model",
  component: "Component",
  simulationCircuit: "Simulation circuit",
  referenceCircuit: "Reference circuit",
}

/** With a selection, include the chosen circuit and its chip dependencies. */
export const getDatasheetAssetFiles = (
  assets: DatasheetAssets,
  selection?: DatasheetUsageKind,
) =>
  (Object.keys(datasheetAssetLabels) as DatasheetAssetKind[]).flatMap((kind) =>
    assets[kind] &&
    (!selection ||
      !["simulationCircuit", "referenceCircuit"].includes(kind) ||
      selection === kind)
      ? [{ kind, ...assets[kind] }]
      : [],
  )

/** Validate before displaying or handing model output to the host. */
export const validateDatasheetAssets = (value: unknown): DatasheetAssets => {
  const result = datasheetAssetsSchema.parse(value)
  const files = getDatasheetAssetFiles(result)
  if (
    new Set(files.map((file) => file.filename.toLowerCase())).size !==
    files.length
  ) {
    throw new Error(
      "The AI returned duplicate filenames. Please generate again.",
    )
  }
  if (files.some((file) => !file.content.trim())) {
    throw new Error("The AI returned an empty file. Please generate again.")
  }
  if (result.simulationCircuit && (!result.component || !result.spiceModel)) {
    throw new Error(
      "The simulation circuit requires a component and SPICE model.",
    )
  }
  if (result.referenceCircuit && !result.component) {
    throw new Error("The reference circuit requires a component.")
  }
  return result
}
