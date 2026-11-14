import {
  getDatasheetAssetFiles,
  validateDatasheetAssets,
  datasheetAssetLabels,
  type DatasheetAssets,
} from "./datasheet-assets"
import { z } from "zod"

export interface DatasheetGeneration {
  id: string
  directory: string
  createdAt: string
  sourceFileName: string
  assets: DatasheetAssets
  files: Record<string, string>
}

const manifestSchema = z.object({
  version: z.literal(1),
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  sourceFileName: z.string(),
  partNumber: z.string(),
  packageName: z.string(),
  summary: z.string(),
  warnings: z.array(z.string()),
  assets: z.array(
    z.object({
      kind: z.enum([
        "footprint",
        "symbol",
        "spiceModel",
        "component",
        "simulationCircuit",
        "referenceCircuit",
      ]),
      filename: z.string(),
      notes: z.string(),
      sourcePages: z.array(z.number()),
    }),
  ),
})

/** Reopen complete generations from their manifest and current project sources. */
export const readDatasheetGenerations = (
  files: ReadonlyMap<string, string> | Record<string, string>,
): DatasheetGeneration[] => {
  const entries = files instanceof Map ? [...files] : Object.entries(files)
  const fs = new Map(entries)
  const generations: DatasheetGeneration[] = []
  const ids = new Set<string>()
  for (const [path, content] of entries) {
    if (!/^generated\/[a-zA-Z0-9_-]+\/generation\.json$/.test(path)) continue
    try {
      const manifest = manifestSchema.parse(JSON.parse(content))
      if (ids.has(manifest.id)) continue
      const directory = path.slice(0, -"/generation.json".length)
      const kinds = manifest.assets.map((asset) => asset.kind)
      if (new Set(kinds).size !== kinds.length) continue
      const sources = Object.fromEntries(
        manifest.assets.map((asset) => [
          asset.kind,
          {
            ...asset,
            content: fs.get(`${directory}/${asset.filename}`),
          },
        ]),
      )
      const assets = validateDatasheetAssets({
        ...Object.fromEntries(
          Object.keys(datasheetAssetLabels).map((kind) => [kind, null]),
        ),
        ...manifest,
        ...sources,
      })
      generations.push({
        id: manifest.id,
        directory,
        createdAt: manifest.createdAt,
        sourceFileName: manifest.sourceFileName,
        assets,
        files: Object.fromEntries(
          entries.filter(([name]) => name.startsWith(directory + "/")),
        ),
      })
      ids.add(manifest.id)
    } catch {
      // Incomplete saves and user-edited manifests remain visible in the file
      // tree, but cannot become actionable generations with missing source.
    }
  }
  return generations.sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  )
}

export const createDatasheetGeneration = (
  assets: DatasheetAssets,
  sourceFileName: string,
): DatasheetGeneration => {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const part =
    assets.partNumber.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) ||
    "component"
  const stamp = createdAt.replace(/\D/g, "").slice(0, 14)
  const directory = `generated/${part}-${stamp}-${id.slice(0, 8)}`
  const assetsFiles = getDatasheetAssetFiles(assets)
  const files = Object.fromEntries(
    assetsFiles.map((file) => [`${directory}/${file.filename}`, file.content]),
  )
  files[`${directory}/generation.json`] = JSON.stringify(
    {
      version: 1,
      id,
      createdAt,
      sourceFileName,
      partNumber: assets.partNumber,
      packageName: assets.packageName,
      summary: assets.summary,
      warnings: assets.warnings,
      assets: assetsFiles.map(({ kind, filename, notes, sourcePages }) => ({
        kind,
        filename,
        notes,
        sourcePages,
      })),
    },
    null,
    2,
  )
  return { id, directory, createdAt, sourceFileName, assets, files }
}

/** Save every artifact before marking a generation ready for use. */
export const saveDatasheetGenerationToApi = async (
  generation: DatasheetGeneration,
  options: { apiBaseUrl?: string; fetch?: typeof globalThis.fetch } = {},
) => {
  const baseUrl =
    options.apiBaseUrl ??
    (typeof window !== "undefined"
      ? window.TSCIRCUIT_FILESERVER_API_BASE_URL
      : undefined) ??
    "/api"
  for (const [file_path, text_content] of Object.entries(generation.files)) {
    const response = await (options.fetch ?? globalThis.fetch)(
      `${baseUrl.replace(/\/$/, "")}/files/upsert`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          file_path,
          text_content,
          initiator: "runframe",
        }),
      },
    )
    if (!response.ok)
      throw new Error(`Could not save generated files (${response.status}).`)
  }
}
