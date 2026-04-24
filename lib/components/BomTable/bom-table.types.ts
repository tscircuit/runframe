import type { AnyCircuitElement } from "circuit-json"
import type { convertCircuitJsonToBomRows } from "circuit-json-to-bom-csv"
import type React from "react"

export interface BomTableProps {
  circuitJson: AnyCircuitElement[]
}

export type BomRow = Awaited<
  ReturnType<typeof convertCircuitJsonToBomRows>
>[number]

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
