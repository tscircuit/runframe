import type { ComponentSearchResult } from "./ImportComponentDialog"
import Fuse from "fuse.js"

let KICAD_FOOTPRINTS: string[] | null = null
let KICAD_FOOTPRINTS_PROMISE: Promise<string[]> | null = null

export const getKicadFootprints = async (): Promise<string[]> => {
  if (KICAD_FOOTPRINTS) return KICAD_FOOTPRINTS
  if (KICAD_FOOTPRINTS_PROMISE) return KICAD_FOOTPRINTS_PROMISE

  KICAD_FOOTPRINTS_PROMISE = fetch(
    "https://kicad-mod-cache.tscircuit.com/kicad_files.json",
  )
    .then((r) => r.json())
    .then((footprints) => {
      KICAD_FOOTPRINTS = footprints
      KICAD_FOOTPRINTS_PROMISE = null
      return footprints
    })

  return KICAD_FOOTPRINTS_PROMISE
}

let fuse: Fuse<string> | null = null

export const searchKicadFootprints = async (
  query: string,
  limit = 20,
): Promise<string[]> => {
  const footprints = await getKicadFootprints()
  if (!fuse) {
    fuse = new Fuse(footprints)
  }
  return fuse
    .search(query)
    .slice(0, limit)
    .map((r) => r.item)
}

export const mapKicadFootprintToSearchResult = (
  footprintPath: string,
): ComponentSearchResult => {
  const footprintString = `kicad:${footprintPath
    .replace(".pretty/", ":")
    .replace(".kicad_mod", "")}`
  return {
    id: `kicad-${footprintPath}`,
    name: footprintString,
    description: footprintPath,
    source: "kicad",
  }
}
