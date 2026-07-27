import type { JlcpcbComponentSearchResult } from "./types"

export const createDirectJlcpcbLookupResult = (
  query: string,
): JlcpcbComponentSearchResult | null => {
  const match = /^C(\d+)$/i.exec(query.trim())
  if (!match) return null

  const lcscId = Number(match[1])
  if (!Number.isSafeInteger(lcscId)) return null

  const partNumber = `C${match[1]}`

  return {
    source: "jlcpcb",
    component: {
      lcscId,
      manufacturer: partNumber,
      partNumber,
      description:
        "Import directly from EasyEDA; stock and availability are unknown",
      package: "",
      isDirectLookup: true,
    },
  }
}

export const addDirectJlcpcbLookupResult = (
  query: string,
  results: JlcpcbComponentSearchResult[],
): JlcpcbComponentSearchResult[] => {
  const directResult = createDirectJlcpcbLookupResult(query)
  if (!directResult) return results

  const alreadyIncluded = results.some(
    (result) =>
      result.component.partNumber.toUpperCase() ===
      directResult.component.partNumber,
  )

  return alreadyIncluded ? results : [directResult, ...results]
}
