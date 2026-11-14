import {
  getDatasheetAssetFiles,
  type DatasheetAssets,
} from "./datasheet-assets"

export interface DatasheetGeneration {
  id: string
  directory: string
  createdAt: string
  sourceFileName: string
  assets: DatasheetAssets
  files: Record<string, string>
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
