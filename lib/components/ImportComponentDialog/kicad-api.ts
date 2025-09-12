import type { ComponentSearchResult } from "./ImportComponentDialog"

let kicadFilesCache: string[] | null = null

/**
 * fetch all KiCad file paths from the tscircuit cache.
 * the result is cached in memory for the session.
 */
const fetchKicadFiles = async (): Promise<string[]> => {
  if (kicadFilesCache) {
    return kicadFilesCache
  }
  try {
    const response = await fetch(
      "https://kicad-mod-cache.tscircuit.com/kicad_files.json",
    )
    if (!response.ok) {
      throw new Error(
        `KiCad API error: ${response.status} ${response.statusText}`,
      )
    }
    const data: string[] = await response.json()
    kicadFilesCache = data
    return data
  } catch (error) {
    console.error("Error fetching KiCad files:", error)
    kicadFilesCache = null
    throw error
  }
}

/**
 * search for KiCad components by filtering the cached list of files.
 * @param query Search query string.
 * @param limit Maximum number of results to return.
 * @returns A promise that resolves to an array of matching KiCad file paths.
 */
export const searchKicadComponents = async (
  query: string,
  limit: number,
): Promise<string[]> => {
  const allFiles = await fetchKicadFiles()
  if (!query) return allFiles.slice(0, limit)

  const lowerCaseQuery = query.toLowerCase()

  const filteredResults = allFiles.filter((file) =>
    file.toLowerCase().includes(lowerCaseQuery),
  )

  return filteredResults.slice(0, limit)
}

/**
 * map a KiCad file path to the ComponentSearchResult format.
 * @param kicadFilePath The full path of the KiCad file (e.g: "Audio_Module.pretty/Reverb_BTDR-1H.kicad_mod").
 * @returns Formatted component data for the UI.
 */
export const mapKicadComponentToSearchResult = (
  kicadFilePath: string,
): ComponentSearchResult => {
  const [libraryPart = "", filePart = ""] = kicadFilePath.split("/")

  let name = filePart.replace(".kicad_mod", "")
  const library = libraryPart.replace(".pretty", "")
  const footprint = `${library}/${name}`

  if (name.length > 50) {name = `${name.slice(0, 50 - 3)}...`}

  return {
    id: `kicad-${kicadFilePath}`,
    name: name,
    source: "kicad",
    partNumber: footprint,
  }
}
