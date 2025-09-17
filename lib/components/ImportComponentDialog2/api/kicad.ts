import Fuse from "fuse.js"
import type { ComponentSearchResult } from "../types"

let footprintsCache: string[] | null = null
let footprintsPromise: Promise<string[]> | null = null
let fuse: Fuse<string> | null = null

const ensureFootprints = async (): Promise<string[]> => {
  if (footprintsCache) return footprintsCache
  if (footprintsPromise) return footprintsPromise

  footprintsPromise = fetch("https://kicad-mod-cache.tscircuit.com/kicad_files.json")
    .then((response) => response.json())
    .then((footprints) => {
      footprintsCache = footprints
      footprintsPromise = null
      return footprints
    })

  return footprintsPromise
}

export const searchKicadFootprints = async (
  query: string,
  limit = 20,
): Promise<string[]> => {
  const footprints = await ensureFootprints()
  if (!fuse) {
    fuse = new Fuse(footprints)
  }
  return fuse
    .search(query)
    .slice(0, limit)
    .map((result) => result.item)
}

export const mapKicadFootprintToSearchResult = (
  footprintPath: string,
): ComponentSearchResult => {
  const cleanedFootprint = footprintPath
    .replace(".pretty/", ":")
    .replace(".kicad_mod", "")
  const footprintString = `kicad:${cleanedFootprint}`

  return {
    id: `kicad-${footprintPath}`,
    name: footprintString,
    description: cleanedFootprint,
    source: "kicad",
  }
}
