import Fuse from "fuse.js"
import type { AnyCircuitElement } from "circuit-json"
import { getDefaultRuntime } from "lib/runtime/default-runtime"
import type { RunFrameRuntime } from "lib/runtime/types"
import type { KicadFootprintSummary } from "../types"

const KICAD_MOD_CACHE_BASE_URL = "https://kicad-mod-cache.tscircuit.com"

interface FootprintIndex {
  footprints?: string[]
  promise?: Promise<string[]>
  fuse?: Fuse<string>
}
const indexes = new WeakMap<RunFrameRuntime, FootprintIndex>()
const getIndex = (runtime: RunFrameRuntime) => {
  let index = indexes.get(runtime)
  if (!index) {
    index = {}
    indexes.set(runtime, index)
  }
  return index
}

const ensureFootprints = async (
  runtime: RunFrameRuntime,
): Promise<string[]> => {
  const index = getIndex(runtime)
  if (index.footprints) return index.footprints
  if (index.promise) return index.promise
  index.promise = runtime
    .fetch(`${KICAD_MOD_CACHE_BASE_URL}/kicad_files.json`)
    .then(async (response) => {
      if (!response.ok)
        throw new Error(
          `KiCad footprint index fetch failed: ${response.status}`,
        )
      const footprints: string[] = await response.json()
      index.footprints = footprints
      return footprints
    })
    .finally(() => {
      index.promise = undefined
    })
  return index.promise
}

export const searchKicadFootprints = async (
  query: string,
  limit = 20,
  runtime = getDefaultRuntime(),
): Promise<string[]> => {
  const footprints = await ensureFootprints(runtime)
  const index = getIndex(runtime)
  index.fuse ??= new Fuse(footprints)
  return index.fuse
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
  runtime = getDefaultRuntime(),
): Promise<AnyCircuitElement[]> => {
  const response = await runtime.fetch(
    `${KICAD_MOD_CACHE_BASE_URL}/${encodeFootprintPath(footprintPath)}`,
  )

  if (!response.ok) {
    throw new Error(`KiCad footprint fetch failed: ${response.status}`)
  }

  const footprintContent = await response.text()
  // Use the shared runtime importer so this converter loads correctly after deploy.
  const { KicadFootprintToCircuitJsonConverter } = await runtime.modules.load(
    "kicad-to-circuit-json",
  )
  const converter = new KicadFootprintToCircuitJsonConverter()

  converter.addFile(
    footprintPath.split("/").pop() ?? "selected-footprint.kicad_mod",
    footprintContent,
  )
  converter.runUntilFinished()

  return converter.getOutput()
}
