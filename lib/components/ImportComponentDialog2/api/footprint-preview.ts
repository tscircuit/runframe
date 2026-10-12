import type { AnyCircuitElement } from "circuit-json"
import {
  loadJlcpcbComponentCircuitJson,
  type JlcpcbPreviewLoadOptions,
} from "./jlcpcb"
import { loadKicadFootprintCircuitJson } from "./kicad"
import type { ImportComponentDialogSearchResult } from "../types"
import type { createLocalDatasheetCatalog } from "lib/optional-features/importing/datasheet-catalog/catalog"

export type FootprintPreviewLoadOptions = {
  jlcpcb?: JlcpcbPreviewLoadOptions
  datasheetCatalog?: ReturnType<typeof createLocalDatasheetCatalog> | null
}

export const canPreviewFootprint = (
  result: ImportComponentDialogSearchResult | null,
) =>
  result?.source === "jlcpcb" ||
  result?.source === "kicad" ||
  result?.source === "datasheets"

export const loadFootprintPreviewCircuitJson = async (
  result: ImportComponentDialogSearchResult,
  opts?: FootprintPreviewLoadOptions,
): Promise<AnyCircuitElement[]> => {
  if (result.source === "datasheets") {
    if (!opts?.datasheetCatalog) {
      throw new Error(
        "Cached datasheet imports require platformConfig.platformFetch",
      )
    }
    return (await opts.datasheetCatalog.loadComponent(result.datasheet))
      .footprintCircuitJson
  }

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
