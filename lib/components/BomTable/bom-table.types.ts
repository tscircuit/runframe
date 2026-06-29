import type { AnyCircuitElement } from "circuit-json"
import type React from "react"
import type { BomRow } from "../../optional-features/exporting/dynamic-converters"

export type { BomRow } from "../../optional-features/exporting/dynamic-converters"

export interface BomTableProps {
  circuitJson: AnyCircuitElement[]
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
