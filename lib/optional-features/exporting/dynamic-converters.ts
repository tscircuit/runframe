/**
 * Dynamic converter loaders using jsdelivr CDN.
 *
 * Instead of bundling heavy converter packages (circuit-json-to-gerber,
 * circuit-json-to-kicad, circuit-json-to-gltf, etc.) into the standalone
 * bundle, this module lazy-loads them on demand from jsdelivr when the
 * user actually requests an export.
 *
 * This reduces the initial bundle size significantly and moves the cost
 * of loading converters to only when they are needed.
 *
 * In Node.js / Bun environments (e.g. tests), the CDN URL import is not
 * supported, so we fall back to a bare package name import which resolves
 * via the local node_modules when the package is installed.
 */

import type { AnyCircuitElement, CircuitJson } from "circuit-json"

/** True when running in a browser context (window exists). */
const isBrowser =
  typeof window !== "undefined" && typeof window.document !== "undefined"

/**
 * Helper that wraps a CDN `import()` with:
 *  - version-pinned URL (no `@latest`)
 *  - cache-bust on failure (rejected promise is cleared so the next
 *    call can retry)
 *  - Node/Bun fallback via bare package name
 */
async function loadCdnOrFallback<T>(
  cdnUrl: string,
  packageName: string,
  promiseRef: { current: Promise<T> | null },
): Promise<T> {
  if (!promiseRef.current) {
    if (isBrowser) {
      promiseRef.current = (
        import(/* @vite-ignore */ cdnUrl) as Promise<T>
      ).catch((err) => {
        // Clear the cache so the next call retries
        promiseRef.current = null
        throw err
      })
    } else {
      // Node.js / Bun: dynamic bare import (resolved via node_modules)
      promiseRef.current = (import(packageName) as Promise<T>).catch((err) => {
        promiseRef.current = null
        throw err
      })
    }
  }
  return promiseRef.current
}

// ─── circuit-json-to-gerber ────────────────────────────────────────────────

export type CircuitJsonToGerberModule = {
  stringifyGerberCommandLayers: (layers: unknown) => Record<string, string>
  convertSoupToGerberCommands: (
    soup: AnyCircuitElement[],
    options: { flip_y_axis: boolean },
  ) => unknown
  convertSoupToExcellonDrillCommands: (params: {
    circuitJson: AnyCircuitElement[]
    is_plated: boolean
    flip_y_axis: boolean
  }) => unknown
  stringifyExcellonDrill: (drillCmds: unknown) => string
}

const gerberModuleRef: { current: Promise<CircuitJsonToGerberModule> | null } =
  { current: null }
const GERBER_CDN_URL =
  "https://cdn.jsdelivr.net/npm/circuit-json-to-gerber@0.0.48/+esm"

export const loadGerberConverter =
  async (): Promise<CircuitJsonToGerberModule> =>
    loadCdnOrFallback(GERBER_CDN_URL, "circuit-json-to-gerber", gerberModuleRef)

// ─── circuit-json-to-bom-csv ──────────────────────────────────────────────

export type CircuitJsonToBomCsvModule = {
  convertCircuitJsonToBomRows: (params: {
    circuitJson: AnyCircuitElement[]
  }) => Promise<unknown[]>
  convertBomRowsToCsv: (rows: unknown[]) => Promise<string>
}

const bomCsvModuleRef: { current: Promise<CircuitJsonToBomCsvModule> | null } =
  { current: null }
const BOM_CSV_CDN_URL =
  "https://cdn.jsdelivr.net/npm/circuit-json-to-bom-csv@0.0.8/+esm"

export const loadBomCsvConverter =
  async (): Promise<CircuitJsonToBomCsvModule> =>
    loadCdnOrFallback(
      BOM_CSV_CDN_URL,
      "circuit-json-to-bom-csv",
      bomCsvModuleRef,
    )

// ─── circuit-json-to-pnp-csv ──────────────────────────────────────────────

export type CircuitJsonToPnpCsvModule = {
  convertCircuitJsonToPickAndPlaceCsv: (
    circuitJson: AnyCircuitElement[],
  ) => Promise<string>
}

const pnpCsvModuleRef: { current: Promise<CircuitJsonToPnpCsvModule> | null } =
  { current: null }
const PNP_CSV_CDN_URL =
  "https://cdn.jsdelivr.net/npm/circuit-json-to-pnp-csv@0.0.7/+esm"

export const loadPnpCsvConverter =
  async (): Promise<CircuitJsonToPnpCsvModule> =>
    loadCdnOrFallback(
      PNP_CSV_CDN_URL,
      "circuit-json-to-pnp-csv",
      pnpCsvModuleRef,
    )

// ─── circuit-json-to-kicad ────────────────────────────────────────────────

export type CircuitJsonToKicadModule = {
  CircuitJsonToKicadPcbConverter: new (
    circuitJson: unknown,
  ) => {
    runUntilFinished: () => void
    getOutputString: () => string
  }
  CircuitJsonToKicadSchConverter: new (
    circuitJson: unknown,
  ) => {
    runUntilFinished: () => void
    getOutputString: () => string
  }
  CircuitJsonToKicadProConverter: new (
    circuitJson: unknown,
    options: {
      projectName: string
      schematicFilename: string
      pcbFilename: string
    },
  ) => {
    runUntilFinished: () => void
    getOutputString: () => string
  }
  CircuitJsonToKicadLibraryConverter: new (
    circuitJson: unknown,
    options?: {
      libraryName?: string
      footprintLibraryName?: string
    },
  ) => {
    runUntilFinished: () => void
    getOutput: () => {
      kicadSymString: string
      footprints: Array<{ footprintName: string; kicadModString: string }>
      model3dSourcePaths: string[]
      fpLibTableString: string
      symLibTableString: string
    }
  }
}

const kicadModuleRef: { current: Promise<CircuitJsonToKicadModule> | null } = {
  current: null,
}
const KICAD_CDN_URL =
  "https://cdn.jsdelivr.net/npm/circuit-json-to-kicad@0.0.89/+esm"

export const loadKicadConverter = async (): Promise<CircuitJsonToKicadModule> =>
  loadCdnOrFallback(KICAD_CDN_URL, "circuit-json-to-kicad", kicadModuleRef)

// ─── circuit-json-to-gltf ─────────────────────────────────────────────────

export type CircuitJsonToGltfModule = {
  convertCircuitJsonToGltf: (
    circuitJson: CircuitJson,
    options?: { format?: string; boardTextureResolution?: number },
  ) => Promise<ArrayBuffer>
}

const gltfModuleRef: { current: Promise<CircuitJsonToGltfModule> | null } = {
  current: null,
}
const GLTF_CDN_URL =
  "https://cdn.jsdelivr.net/npm/circuit-json-to-gltf@0.0.87/+esm"

export const loadGltfConverter = async (): Promise<CircuitJsonToGltfModule> =>
  loadCdnOrFallback(GLTF_CDN_URL, "circuit-json-to-gltf", gltfModuleRef)

// ─── circuit-json-to-step ─────────────────────────────────────────────────

export type CircuitJsonToStepModule = {
  circuitJsonToStep: (
    circuitJson: CircuitJson,
    options?: {
      boardWidth?: number
      boardHeight?: number
      boardThickness?: number
      productName?: string
      includeComponents?: boolean
      includeExternalMeshes?: boolean
    },
  ) => Promise<string>
}

const stepModuleRef: { current: Promise<CircuitJsonToStepModule> | null } = {
  current: null,
}
const STEP_CDN_URL =
  "https://cdn.jsdelivr.net/npm/circuit-json-to-step@0.0.19/+esm"

export const loadStepConverter = async (): Promise<CircuitJsonToStepModule> =>
  loadCdnOrFallback(STEP_CDN_URL, "circuit-json-to-step", stepModuleRef)

// ─── circuit-json-to-lbrn ─────────────────────────────────────────────────

export type CircuitJsonToLbrnModule = {
  convertCircuitJsonToLbrn: (
    circuitJson: CircuitJson,
    options?: { includeSilkscreen?: boolean },
  ) => Promise<{ toXml: () => string }>
}

const lbrnModuleRef: { current: Promise<CircuitJsonToLbrnModule> | null } = {
  current: null,
}
const LBRN_CDN_URL =
  "https://cdn.jsdelivr.net/npm/circuit-json-to-lbrn@0.0.69/+esm"

export const loadLbrnConverter = async (): Promise<CircuitJsonToLbrnModule> =>
  loadCdnOrFallback(LBRN_CDN_URL, "circuit-json-to-lbrn", lbrnModuleRef)
