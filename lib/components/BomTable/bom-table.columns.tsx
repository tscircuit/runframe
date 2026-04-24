import type { BomCellDescriptor, BomMetadata, BomRow } from "./bom-table.types"

const linkify = (supplier: string, partNumber: string) => {
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

const formatManufacturerMpnPairs = (pairs: BomRow["manufacturer_mpn_pairs"]) =>
  pairs?.map(({ manufacturer, mpn }) => `${manufacturer}: ${mpn}`).join(", ")

export const getBomMetadata = (rows: BomRow[]): BomMetadata => {
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

export const getBomCellDescriptors = (
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
