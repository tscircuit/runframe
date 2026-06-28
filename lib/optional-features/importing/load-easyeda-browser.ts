import type { AnyCircuitElement } from "circuit-json"

const EASYEDA_BROWSER_URL =
  "https://cdn.jsdelivr.net/npm/easyeda@latest/dist/browser/index.js"

type EasyedaBrowserModule = {
  fetchEasyEDAComponent: (
    partNumber: string,
    options?: {
      fetch?: (url: RequestInfo, init?: RequestInit) => Promise<Response>
      includeModelMetadata?: boolean
    },
  ) => Promise<any>
  EasyEdaJsonSchema: {
    parse: (value: any) => any
  }
  convertEasyEdaJsonToCircuitJson: (
    easyEdaJson: any,
    options?: Record<string, unknown>,
  ) => AnyCircuitElement[]
  convertRawEasyToTsx: (opts: { rawEasy: any }) => Promise<string>
}

let easyedaBrowserPromise: Promise<EasyedaBrowserModule> | null = null

export const loadEasyedaBrowser = async (): Promise<EasyedaBrowserModule> => {
  if (!easyedaBrowserPromise) {
    easyedaBrowserPromise = import(
      /* @vite-ignore */ EASYEDA_BROWSER_URL
    ) as Promise<EasyedaBrowserModule>
  }

  return easyedaBrowserPromise
}
