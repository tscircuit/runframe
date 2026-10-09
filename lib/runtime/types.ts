import type * as ComponentBoxModule from "circuit-json-to-fdm-component-box"

export interface RunFrameModuleMap {
  "circuit-json-to-gerber": typeof import("circuit-json-to-gerber")
  "circuit-json-to-bom-csv": typeof import("circuit-json-to-bom-csv")
  "circuit-json-to-pnp-csv": typeof import("circuit-json-to-pnp-csv")
  "circuit-json-to-kicad": typeof import("circuit-json-to-kicad")
  "circuit-json-to-gltf": typeof import("circuit-json-to-gltf")
  "circuit-json-to-step": typeof import("circuit-json-to-step")
  "circuit-json-to-lbrn": typeof import("circuit-json-to-lbrn")
  "circuit-json-to-fdm-component-box": typeof ComponentBoxModule
  "circuit-to-svg": typeof import("circuit-to-svg")
  "kicad-to-circuit-json": typeof import("kicad-to-circuit-json")
  // The pinned Git package ships TypeScript source rather than declarations.
  "circuit-json-to-altium": {
    convertCircuitJsonToAltiumZip: (
      circuitJson: import("circuit-json").CircuitJson,
      projectName: string,
    ) => Promise<Uint8Array>
  }
  easyeda: typeof import("easyeda/browser")
}

export type RunFrameModuleName = keyof RunFrameModuleMap

export type RunFrameFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>

export interface RunFrameModuleProvider {
  load<K extends RunFrameModuleName>(name: K): Promise<RunFrameModuleMap[K]>
}

export interface RunFrameRuntime {
  readonly mode: "online" | "offline"
  readonly modules: RunFrameModuleProvider
  /** Resource transport for first-party UI import/export helpers. */
  readonly fetch: RunFrameFetch
  /** Installed evaluator version; required for an offline runner. */
  readonly evalVersion?: string
  /** Local worker URL, supplied by the containing application. */
  readonly workerUrl?: string
}

export interface RunFrameRuntimeProps {
  runtime?: RunFrameRuntime
}
