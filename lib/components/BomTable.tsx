import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToBomRows } from "circuit-json-to-bom-csv"
import { useEffect, useState } from "react"

interface BomTableProps {
  circuitJson: AnyCircuitElement[]
}

export const linkify = (supplier: string, partNumber: string) => {
  if (supplier === "jlcpcb") {
    return (
      <a
        className="rf-underline rf-text-blue-500"
        target="_blank"
        rel="noreferrer"
        href={`https://jlcpcb.com/partdetail/${partNumber}`}
      >
        {partNumber}
      </a>
    )
  }
  return partNumber
}

type BomRow = Awaited<ReturnType<typeof convertCircuitJsonToBomRows>>[number]

type BomMetadata = {
  extraColumnNames: string[]
  hasSupplierColumn: boolean
  hasManufacturerColumn: boolean
}

type BomCellDescriptor = {
  key: string
  label: string
  getCell: (row: BomRow) => React.ReactNode
}

const formatManufacturerMpnPairs = (pairs: BomRow["manufacturer_mpn_pairs"]) =>
  pairs?.map(({ manufacturer, mpn }) => `${manufacturer}: ${mpn}`).join(", ")

const getBomMetadata = (rows: BomRow[]): BomMetadata => {
  const extraColumns = new Set<string>()
  let hasSupplierColumn = false
  let hasManufacturerColumn = false

  for (const row of rows) {
    if (row.supplier_part_number_columns?.["JLCPCB Part #"] !== undefined) {
      hasSupplierColumn = true
    }

    for (const extraColumnName of Object.keys(row.extra_columns ?? {})) {
      extraColumns.add(extraColumnName)
    }

    if ((row.manufacturer_mpn_pairs?.length ?? 0) > 0) {
      hasManufacturerColumn = true
    }
  }

  return {
    extraColumnNames: [...extraColumns],
    hasSupplierColumn,
    hasManufacturerColumn,
  }
}

const getBomCellDescriptors = (
  bomMetadata: BomMetadata,
): BomCellDescriptor[] => {
  const bomCellDescriptors: BomCellDescriptor[] = [
    {
      key: "designator",
      label: "Designator",
      getCell: (row) => row.designator,
    },
    {
      key: "comment",
      label: "Comment",
      getCell: (row) => row.comment,
    },
    {
      key: "value",
      label: "Component Value",
      getCell: (row) => row.value,
    },
    {
      key: "footprint",
      label: "Footprint",
      getCell: (row) => row.footprint,
    },
  ]

  if (bomMetadata.hasSupplierColumn) {
    bomCellDescriptors.push({
      key: "supplier:JLCPCB Part #",
      label: "JLCPCB Part #",
      getCell: (row) => {
        const partNumber = row.supplier_part_number_columns?.["JLCPCB Part #"]
        return partNumber ? linkify("jlcpcb", partNumber) : ""
      },
    })
  }

  if (bomMetadata.hasManufacturerColumn) {
    bomCellDescriptors.push({
      key: "manufacturer_mpn_pairs",
      label: "Manufacturer / MPN",
      getCell: (row) => formatManufacturerMpnPairs(row.manufacturer_mpn_pairs),
    })
  }

  for (const extraColumnName of bomMetadata.extraColumnNames) {
    bomCellDescriptors.push({
      key: `extra:${extraColumnName}`,
      label: extraColumnName,
      getCell: (row) => row.extra_columns?.[extraColumnName] || "",
    })
  }

  return bomCellDescriptors
}

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
