import ky from "ky"
import { z } from "zod"
import { adaptCachedDatasheet } from "./adapter"
import { normalizeDatasheetChipName } from "./create-cached-datasheet-fetch"
import {
  datasheetCatalogEntrySchema,
  type DatasheetCatalogEntry,
} from "./types"

export type { DatasheetCatalogEntry, AdaptedCachedDatasheet } from "./types"

export interface LocalDatasheetCatalogOptions {
  /** Required cache-only transport. There is no global-fetch default. */
  platformFetch: typeof fetch
  apiBaseUrl?: string
}

const parseIndex = (input: unknown): DatasheetCatalogEntry[] => {
  const parsed = z
    .object({ datasheets: z.array(datasheetCatalogEntrySchema) })
    .safeParse(input)
  if (!parsed.success) {
    throw new Error(`Invalid cached datasheet index: ${parsed.error.message}`)
  }
  const ids = new Set<string>()
  const names = new Set<string>()
  for (const entry of parsed.data.datasheets) {
    const normalizedName = normalizeDatasheetChipName(entry.chip_name)
    if (
      !normalizedName ||
      ids.has(entry.datasheet_id) ||
      names.has(normalizedName)
    ) {
      throw new Error(
        `Invalid or duplicate cached datasheet identity: ${entry.chip_name}`,
      )
    }
    ids.add(entry.datasheet_id)
    names.add(normalizedName)
  }
  return parsed.data.datasheets
}

/** Search local metadata and adapt selected stored records, without supplier requests. */
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
  const readJson = (url: URL) =>
    ky
      .get(url, { fetch: platformFetch, retry: 0, timeout: false })
      .json<unknown>()
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
