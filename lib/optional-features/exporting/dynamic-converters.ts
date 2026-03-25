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
 */

import type { AnyCircuitElement, CircuitJson } from "circuit-json"

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

let gerberModulePromise: Promise<CircuitJsonToGerberModule> | null = null
const GERBER_CDN_URL =
  "https://cdn.jsdelivr.net/npm/circuit-json-to-gerber@latest/+esm"

export const loadGerberConverter =
  async (): Promise<CircuitJsonToGerberModule> => {
    if (!gerberModulePromise) {
      gerberModulePromise = import(
        /* @vite-ignore */ GERBER_CDN_URL
      ) as Promise<CircuitJsonToGerberModule>
    }
    return gerberModulePromise
  }

// ─── circuit-json-to-bom-csv ──────────────────────────────────────────────

export type CircuitJsonToBomCsvModule = {
  convertCircuitJsonToBomRows: (params: {
    circuitJson: AnyCircuitElement[]
  }) => Promise<unknown[]>
  convertBomRowsToCsv: (rows: unknown[]) => Promise<string>
}

let bomCsvModulePromise: Promise<CircuitJsonToBomCsvModule> | null = null
const BOM_CSV_CDN_URL =
  "https://cdn.jsdelivr.net/npm/circuit-json-to-bom-csv@latest/+esm"

export const loadBomCsvConverter =
  async (): Promise<CircuitJsonToBomCsvModule> => {
    if (!bomCsvModulePromise) {
      bomCsvModulePromise = import(
        /* @vite-ignore */ BOM_CSV_CDN_URL
      ) as Promise<CircuitJsonToBomCsvModule>
    }
    return bomCsvModulePromise
  }

// ─── circuit-json-to-pnp-csv ──────────────────────────────────────────────

export type CircuitJsonToPnpCsvModule = {
  convertCircuitJsonToPickAndPlaceCsv: (
    circuitJson: AnyCircuitElement[],
  ) => Promise<string>
}

let pnpCsvModulePromise: Promise<CircuitJsonToPnpCsvModule> | null = null
const PNP_CSV_CDN_URL =
  "https://cdn.jsdelivr.net/npm/circuit-json-to-pnp-csv@latest/+esm"

export const loadPnpCsvConverter =
  async (): Promise<CircuitJsonToPnpCsvModule> => {
    if (!pnpCsvModulePromise) {
      pnpCsvModulePromise = import(
        /* @vite-ignore */ PNP_CSV_CDN_URL
      ) as Promise<CircuitJsonToPnpCsvModule>
    }
    return pnpCsvModulePromise
  }

// ─── circuit-json-to-kicad ────────────────────────────────────────────────

export type CircuitJsonToKicadModule = {
  CircuitJsonToKicadPcbConverter: new (circuitJson: unknown) => {
    runUntilFinished: () => void
    getOutputString: () => string
  }
  CircuitJsonToKicadSchConverter: new (circuitJson: unknown) => {
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

let kicadModulePromise: Promise<CircuitJsonToKicadModule> | null = null
const KICAD_CDN_URL =
  "https://cdn.jsdelivr.net/npm/circuit-json-to-kicad@latest/+esm"

export const loadKicadConverter =
  async (): Promise<CircuitJsonToKicadModule> => {
    if (!kicadModulePromise) {
      kicadModulePromise = import(
        /* @vite-ignore */ KICAD_CDN_URL
      ) as Promise<CircuitJsonToKicadModule>
    }
    return kicadModulePromise
  }

// ─── circuit-json-to-gltf ─────────────────────────────────────────────────

export type CircuitJsonToGltfModule = {
  convertCircuitJsonToGltf: (
    circuitJson: CircuitJson,
    options?: { format?: string; boardTextureResolution?: number },
  ) => Promise<ArrayBuffer>
}

let gltfModulePromise: Promise<CircuitJsonToGltfModule> | null = null
const GLTF_CDN_URL =
  "https://cdn.jsdelivr.net/npm/circuit-json-to-gltf@latest/+esm"

export const loadGltfConverter =
  async (): Promise<CircuitJsonToGltfModule> => {
    if (!gltfModulePromise) {
      gltfModulePromise = import(
        /* @vite-ignore */ GLTF_CDN_URL
      ) as Promise<CircuitJsonToGltfModule>
    }
    return gltfModulePromise
  }

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

let stepModulePromise: Promise<CircuitJsonToStepModule> | null = null
const STEP_CDN_URL =
  "https://cdn.jsdelivr.net/npm/circuit-json-to-step@latest/+esm"

export const loadStepConverter =
  async (): Promise<CircuitJsonToStepModule> => {
    if (!stepModulePromise) {
      stepModulePromise = import(
        /* @vite-ignore */ STEP_CDN_URL
      ) as Promise<CircuitJsonToStepModule>
    }
    return stepModulePromise
  }

// ─── circuit-json-to-lbrn ─────────────────────────────────────────────────

export type CircuitJsonToLbrnModule = {
  convertCircuitJsonToLbrn: (
    circuitJson: CircuitJson,
    options?: { includeSilkscreen?: boolean },
  ) => Promise<{ toXml: () => string }>
}

let lbrnModulePromise: Promise<CircuitJsonToLbrnModule> | null = null
const LBRN_CDN_URL =
  "https://cdn.jsdelivr.net/npm/circuit-json-to-lbrn@latest/+esm"

export const loadLbrnConverter =
  async (): Promise<CircuitJsonToLbrnModule> => {
    if (!lbrnModulePromise) {
      lbrnModulePromise = import(
        /* @vite-ignore */ LBRN_CDN_URL
      ) as Promise<CircuitJsonToLbrnModule>
    }
    return lbrnModulePromise
  }
