import * as gerber from "circuit-json-to-gerber"
import * as bom from "circuit-json-to-bom-csv"
import * as pnp from "circuit-json-to-pnp-csv"
import * as kicad from "circuit-json-to-kicad"
import * as gltf from "circuit-json-to-gltf"
import * as step from "circuit-json-to-step"
import * as lbrn from "circuit-json-to-lbrn"
import * as componentBox from "circuit-json-to-fdm-component-box"
import * as svg from "circuit-to-svg"
import * as kicadImport from "kicad-to-circuit-json"
import * as altium from "circuit-json-to-altium"
import * as easyeda from "easyeda/browser"
import { createBundledModuleProvider } from "./bundled-module-provider"
import { createLocalFetch } from "./local-fetch"
import type { RunFrameModuleMap, RunFrameRuntime } from "./types"

const bundledModules = {
  "circuit-json-to-gerber": gerber,
  "circuit-json-to-bom-csv": bom,
  "circuit-json-to-pnp-csv": pnp,
  "circuit-json-to-kicad": kicad,
  "circuit-json-to-gltf": gltf,
  "circuit-json-to-step": step,
  "circuit-json-to-lbrn": lbrn,
  "circuit-json-to-fdm-component-box": componentBox,
  "circuit-to-svg": svg,
  "kicad-to-circuit-json": kicadImport,
  "circuit-json-to-altium": altium,
  easyeda,
} satisfies RunFrameModuleMap

export interface OfflineRuntimeOptions {
  /** Origin used for local assets. Defaults to the containing page's URL. */
  baseUrl?: string
  /** A separately shipped evaluator worker. No worker is downloaded by default. */
  workerUrl?: string
  /** Exact version of that worker. */
  evalVersion?: string
}

export const createOfflineRuntime = (
  options: OfflineRuntimeOptions = {},
): RunFrameRuntime => ({
  mode: "offline",
  modules: createBundledModuleProvider(bundledModules),
  fetch: createLocalFetch(options.baseUrl),
  workerUrl: options.workerUrl,
  evalVersion: options.evalVersion,
})
