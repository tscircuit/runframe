import type { PinAttributeMap } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"

export interface DatasheetCatalogEntry {
  datasheet_id: string
  chip_name: string
  description?: string
}

/**
 * Supported cached API subset: a local Footprinter recipe and a complete physical
 * pin table. Descriptions and electrical attributes may be absent. Source-code,
 * supplier, PDF, and CAD fields from the API are deliberately not imported.
 * Unnumbered thermal pads require an explicit thermalpad alias in the pin table.
 */
export interface CachedDatasheet {
  datasheet_id: string
  chip_name: string
  ai_description?: string | null
  footprinter_string: string
  pin_information: Array<{
    pin_number: string
    name: string[]
    description?: string
    capabilities?: string[]
  }>
  pin_attributes?: Record<string, PinAttributeMap> | null
}

export interface AdaptedCachedDatasheet {
  datasheetId: string
  chipName: string
  componentName: string
  description?: string
  tsx: string
  footprintCircuitJson: AnyCircuitElement[]
  footprint: string
  pinLabels: Record<string, string[]>
  pinAttributes: Record<string, PinAttributeMap>
}
