import type { AnyCircuitElement } from "circuit-json"
import type { convertCircuitJsonToBomRows } from "circuit-json-to-bom-csv"
import type React from "react"
import type { BomPriceEngine } from "./bom-pricing"

export interface BomTableProps {
  circuitJson: AnyCircuitElement[]
  /** Defaults to the JLCPCB engine; unsupported stores retain their links. */
  partsEngine?: BomPriceEngine
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
