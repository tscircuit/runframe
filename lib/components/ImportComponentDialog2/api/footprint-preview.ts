import type { AnyCircuitElement } from "circuit-json"
import {
  loadJlcpcbComponentCircuitJson,
  type JlcpcbPreviewLoadOptions,
} from "./jlcpcb"
import { hasEasyEdaProxyEndpoint } from "lib/optional-features/importing/create-easyeda-proxy-fetch"
import { loadKicadFootprintCircuitJson } from "./kicad"
import type { ImportComponentDialogSearchResult } from "../types"

export type FootprintPreviewLoadOptions = {
  jlcpcb?: JlcpcbPreviewLoadOptions
}

export const canPreviewFootprint = (
  result: ImportComponentDialogSearchResult | null,
  opts?: FootprintPreviewLoadOptions,
) => {
  if (result?.source === "jlcpcb") {
    return hasEasyEdaProxyEndpoint(opts?.jlcpcb)
  }

  return result?.source === "kicad"
}

export const loadFootprintPreviewCircuitJson = async (
  result: ImportComponentDialogSearchResult,
  opts?: FootprintPreviewLoadOptions,
): Promise<AnyCircuitElement[]> => {
  if (result.source === "jlcpcb") {
    return loadJlcpcbComponentCircuitJson(
      result.component.partNumber,
      opts?.jlcpcb,
    )
  }

  if (result.source === "kicad") {
    return loadKicadFootprintCircuitJson(result.footprint.path)
  }

  throw new Error("Footprint preview is not available for this source")
}
