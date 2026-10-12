import { pinAttributeMap, type PinAttributeMap } from "@tscircuit/props"
import { z } from "zod"
import type { AnyCircuitElement } from "circuit-json"

/**
 * Supported cached API subset: a local Footprinter recipe and a complete physical
 * pin table. Descriptions and electrical attributes may be absent. Source-code,
 * supplier, PDF, and CAD fields from the API are deliberately not imported.
 * Unnumbered thermal pads require an explicit thermalpad alias in the pin table.
 */
export const cachedDatasheetSchema = z.object({
  datasheet_id: z.string().uuid(),
  chip_name: z.string().trim().min(1),
  ai_description: z.string().nullish(),
  footprinter_string: z.string().trim().min(1).max(8192),
  pin_information: z
    .array(
      z.object({
        pin_number: z.string().trim().min(1),
        name: z.array(z.string().trim().min(1)),
        description: z.string().optional(),
        capabilities: z.array(z.string()).optional(),
      }),
    )
    .min(1),
  pin_attributes: z.record(pinAttributeMap).nullish(),
})

export type CachedDatasheet = z.infer<typeof cachedDatasheetSchema>

export const datasheetCatalogEntrySchema = cachedDatasheetSchema
  .pick({ datasheet_id: true, chip_name: true, ai_description: true })
  .extend({ description: z.string().nullish() })
  .transform(({ datasheet_id, chip_name, description, ai_description }) => ({
    datasheet_id,
    chip_name,
    ...((description ?? ai_description)
      ? { description: (description ?? ai_description)! }
      : {}),
  }))
export type DatasheetCatalogEntry = z.infer<typeof datasheetCatalogEntrySchema>

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
