import { convertCircuitJsonToBomRows } from "circuit-json-to-bom-csv"
import { useEffect, useState } from "react"
import type React from "react"
import { getBomCellDescriptors, getBomMetadata } from "./bom-table.columns"
import type { BomRow, BomTableProps } from "./bom-table.types"

export const BomTable: React.FC<BomTableProps> = ({ circuitJson }) => {
  const [rows, setRows] = useState<BomRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadBomTable = async () => {
      try {
        setError(null)
        setRows(null)

        const bomRows = await convertCircuitJsonToBomRows({
          circuitJson,
        })

        if (!cancelled) {
          setRows(bomRows)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown BOM error")
        }
      }
    }

    void loadBomTable()

    return () => {
      cancelled = true
    }
  }, [circuitJson])

  if (error) {
    throw new Error(error)
  }

  const bomMetadata = getBomMetadata(rows ?? [])
  const bomCellDescriptors = getBomCellDescriptors(bomMetadata)

  if (!rows) {
    return (
      <div className="rf-p-4 rf-text-sm rf-text-muted-foreground">
        Loading BOM...
      </div>
    )
  }

  return (
    <div className="rf-overflow-x-auto">
      <table className="rf-w-full rf-text-left rf-text-sm">
        <thead>
          <tr className="rf-border-b">
            {bomCellDescriptors.map((bomCellDescriptor) => (
              <th key={bomCellDescriptor.key} className="rf-p-2">
                {bomCellDescriptor.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.designator || `${rowIndex}`} className="rf-border-b">
              {bomCellDescriptors.map((bomCellDescriptor) => (
                <td key={bomCellDescriptor.key} className="rf-p-2">
                  {bomCellDescriptor.getCell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
