import type { AnyCircuitElement } from "circuit-json"
import type React from "react"

export interface BomTableProps {
  circuitJson: AnyCircuitElement[]
}

export type BomRow = {
  designator?: string
  comment?: string
  value?: string
  footprint?: string
  supplier_part_number_columns?: Record<string, string>
  extra_columns?: Record<string, string>
  manufacturer_mpn_pairs?: Array<{
    manufacturer: string
    mpn: string
  }>
}

export type BomMetadata = {
  extraColumnNames: string[]
  hasSupplierColumn: boolean
  hasManufacturerColumn: boolean
}

export type BomCellDescriptor = {
  key: string
  label: string
  getCell: (row: BomRow) => React.ReactNode
}
