import { adaptCachedDatasheet } from "./adapter"
import { normalizeDatasheetChipName } from "./create-cached-datasheet-fetch"
import type { DatasheetCatalogEntry } from "./types"

export type { DatasheetCatalogEntry, AdaptedCachedDatasheet } from "./types"

export interface LocalDatasheetCatalogOptions {
  /** Required cache-only transport. There is no global-fetch default. */
  platformFetch: typeof fetch
  apiBaseUrl?: string
}

const parseIndex = (input: unknown): DatasheetCatalogEntry[] => {
  const rows = (input as { datasheets?: unknown })?.datasheets
  if (!Array.isArray(rows)) {
    throw new Error(
      "Invalid cached datasheet index: expected a datasheets array",
    )
  }
  const ids = new Set<string>()
  const names = new Set<string>()
  return rows.map((row) => {
    if (
      !row ||
      typeof row.datasheet_id !== "string" ||
      !row.datasheet_id.trim() ||
      typeof row.chip_name !== "string" ||
      !normalizeDatasheetChipName(row.chip_name)
    ) {
      throw new Error(
        "Invalid cached datasheet index entry: expected datasheet_id and chip_name",
      )
    }
    const normalizedName = normalizeDatasheetChipName(row.chip_name)
    if (ids.has(row.datasheet_id) || names.has(normalizedName)) {
      throw new Error(`Duplicate cached datasheet identity: ${row.chip_name}`)
    }
    ids.add(row.datasheet_id)
    names.add(normalizedName)
    const description = row.description ?? row.ai_description
    if (description != null && typeof description !== "string") {
      throw new Error(`Invalid cached datasheet description: ${row.chip_name}`)
    }
    return {
      datasheet_id: row.datasheet_id,
      chip_name: row.chip_name,
      ...(description ? { description } : {}),
    }
  })
}

/** Search local metadata and adapt selected stored records, without JLC/EasyEDA. */
export const createLocalDatasheetCatalog = ({
  platformFetch,
  apiBaseUrl = "https://api.tscircuit.com",
}: LocalDatasheetCatalogOptions) => {
  if (typeof platformFetch !== "function") {
    throw new Error(
      "Cached datasheet imports require platformConfig.platformFetch",
    )
  }
  const base = new URL(`${apiBaseUrl.replace(/\/$/, "")}/`)
  const readJson = async (url: URL) => {
    const response = await platformFetch(url.toString())
    if (!response.ok) {
      throw new Error(
        `Cached datasheet read failed (${response.status}): ${url.pathname}`,
      )
    }
    return response.json() as Promise<unknown>
  }
  return {
    search: async (
      query: string,
      limit = 10,
    ): Promise<DatasheetCatalogEntry[]> => {
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new Error(
          "Datasheet search limit must be an integer between 1 and 100",
        )
      }
      const trimmed = query.trim().toLowerCase()
      if (!trimmed) return []
      const normalizedQuery = normalizeDatasheetChipName(trimmed)
      const entries = parseIndex(
        await readJson(new URL("datasheets/list", base)),
      )
      return entries
        .map((entry) => {
          const name = normalizeDatasheetChipName(entry.chip_name)
          const score =
            normalizedQuery && name === normalizedQuery
              ? 0
              : normalizedQuery && name.startsWith(normalizedQuery)
                ? 1
                : normalizedQuery && name.includes(normalizedQuery)
                  ? 2
                  : entry.description?.toLowerCase().includes(trimmed)
                    ? 3
                    : -1
          return { entry, score }
        })
        .filter(({ score }) => score >= 0)
        .sort(
          (a, b) =>
            a.score - b.score ||
            a.entry.chip_name.localeCompare(b.entry.chip_name),
        )
        .slice(0, limit)
        .map(({ entry }) => entry)
    },
    loadComponent: async (entry: DatasheetCatalogEntry) => {
      const url = new URL("datasheets/get", base)
      url.searchParams.set(
        "chip_name",
        normalizeDatasheetChipName(entry.chip_name),
      )
      const component = adaptCachedDatasheet(await readJson(url))
      if (
        component.datasheetId !== entry.datasheet_id ||
        normalizeDatasheetChipName(component.chipName) !==
          normalizeDatasheetChipName(entry.chip_name)
      ) {
        throw new Error(
          `Cached datasheet does not match selected part: ${entry.chip_name}`,
        )
      }
      return component
    },
  }
}
