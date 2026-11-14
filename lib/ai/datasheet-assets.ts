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
  warnings: z.array(z.string().max(4_000)).max(50),
})

const datasheetClarificationSchema = z.object({
  question: z.string().min(1).max(1_000),
  options: z
    .array(
      z.object({
        partNumber: z.string().min(1).max(100),
        packageName: z.string().min(1).max(90),
        description: z.string().max(800),
        sourcePages: z.array(z.number().int().positive()).max(100),
      }),
    )
    .min(1)
    .max(20),
})

// Provider output requires every property, including nullable clarification.
// Keep the host's accepted-assets format independent of this intermediate step.
export const datasheetGenerationSchema = datasheetAssetsSchema.extend({
  clarification: datasheetClarificationSchema.nullable(),
})

export type DatasheetClarification = z.infer<
  typeof datasheetClarificationSchema
>
export type DatasheetGenerationResult = DatasheetAssets & {
  clarification?: DatasheetClarification
}

export type DatasheetAssets = z.infer<typeof datasheetAssetsSchema>
export type DatasheetAsset = z.infer<typeof asset>
export type DatasheetAssetKind =
  | "footprint"
  | "symbol"
  | "spiceModel"
  | "component"

export const datasheetAssetLabels: Record<DatasheetAssetKind, string> = {
  footprint: "Footprint",
  symbol: "Symbol",
  spiceModel: "SPICE model",
  component: "Component",
}

export const getDatasheetAssetFiles = (assets: DatasheetAssets) =>
  (Object.keys(datasheetAssetLabels) as DatasheetAssetKind[]).flatMap((kind) =>
    assets[kind] ? [{ kind, ...assets[kind] }] : [],
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
  return result
}
