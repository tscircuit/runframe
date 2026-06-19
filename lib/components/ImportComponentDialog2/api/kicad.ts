import Fuse from "fuse.js"
import type { AnyCircuitElement } from "circuit-json"
import type { KicadFootprintSummary } from "../types"

const KICAD_MOD_CACHE_BASE_URL = "https://kicad-mod-cache.tscircuit.com"

let footprintsCache: string[] | null = null
let footprintsPromise: Promise<string[]> | null = null
let fuse: Fuse<string> | null = null

const ensureFootprints = async (): Promise<string[]> => {
  if (footprintsCache) return footprintsCache
  if (footprintsPromise) return footprintsPromise

  footprintsPromise = fetch(
    "https://kicad-mod-cache.tscircuit.com/kicad_files.json",
  )
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

export const mapKicadFootprintToSummary = (
  footprintPath: string,
): KicadFootprintSummary => {
  const cleanedFootprint = footprintPath
    .replace(".pretty/", "/")
    .replace(".kicad_mod", "")
  const footprintString = `kicad:${cleanedFootprint}`

  return {
    path: footprintPath,
    qualifiedName: footprintString,
    description: cleanedFootprint,
  }
}

const encodeFootprintPath = (footprintPath: string) =>
  footprintPath
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")

export const loadKicadFootprintCircuitJson = async (
  footprintPath: string,
): Promise<AnyCircuitElement[]> => {
  const response = await fetch(
    `${KICAD_MOD_CACHE_BASE_URL}/${encodeFootprintPath(footprintPath)}`,
  )

  if (!response.ok) {
    throw new Error(`KiCad footprint fetch failed: ${response.status}`)
  }

  const footprintContent = await response.text()
  const { KicadFootprintToCircuitJsonConverter } = await import(
    "kicad-to-circuit-json"
  )
  const converter = new KicadFootprintToCircuitJsonConverter()

  converter.addFile(
    footprintPath.split("/").pop() ?? "selected-footprint.kicad_mod",
    footprintContent,
  )
  converter.runUntilFinished()

  return converter.getOutput()
}
