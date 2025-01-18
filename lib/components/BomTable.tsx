import type { SupplierName } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"

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

export const BomTable: React.FC<BomTableProps> = ({ circuitJson }) => {
  const sourceComponents = circuitJson.filter(
    (el) => el.type === "source_component",
  )

  const supplierColumns = new Set<SupplierName>()
  for (const comp of sourceComponents) {
    if (comp.supplier_part_numbers) {
      for (const supplier of Object.keys(comp.supplier_part_numbers)) {
        supplierColumns.add(supplier as SupplierName)
      }
    }
  }

  return (
    <div className="rf-overflow-x-auto">
      <table className="rf-w-full rf-text-left rf-text-sm">
        <thead>
          <tr className="rf-border-b">
            <th className="rf-p-2">Name</th>
            {Array.from(supplierColumns).map((supplier) => (
              <th key={supplier} className="rf-p-2 rf-capitalize">
                {supplier}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sourceComponents.map((comp) => (
            <tr key={comp.source_component_id} className="rf-border-b">
              <td className="rf-p-2">{comp.name}</td>
              {Array.from(supplierColumns).map((supplier) => (
                <td key={supplier} className="rf-p-2">
                  {linkify(
                    supplier,
                    comp.supplier_part_numbers?.[supplier]?.[0] || "",
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
