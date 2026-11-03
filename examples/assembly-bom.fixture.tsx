import type { AnyCircuitElement } from "circuit-json"
import type { PartsEngine } from "@tscircuit/props"
import { useStyles } from "../lib/hooks/use-styles"
import { BomTable } from "../lib/components/BomTable"

const circuitJson: AnyCircuitElement[] = [
  {
    type: "source_component",
    ftype: "subassembly",
    source_component_id: "device",
    name: "Sensor device",
    bom_assembly_mode: "build",
  },
  {
    type: "source_component",
    ftype: "subassembly",
    source_component_id: "power",
    name: "Power module",
    parent_source_component_id: "device",
    bom_assembly_mode: "build",
  },
  {
    type: "source_component",
    ftype: "subassembly",
    source_component_id: "regulator",
    name: "3.3 V regulator",
    parent_source_component_id: "power",
    bom_sources: [
      { supplier_name: "jlcpcb", supplier_part_number: "C123" },
      { supplier_name: "mouser", supplier_part_number: "ALT-123" },
    ],
  },
  {
    type: "source_component",
    ftype: "subassembly",
    source_component_id: "housing",
    name: "ABS enclosure",
    parent_source_component_id: "device",
    bom_sources: [{ supplier_name: "amazon", url: "https://www.amazon.com/" }],
  },
  {
    type: "source_component",
    ftype: "subassembly",
    source_component_id: "module",
    name: "Purchased sensor module",
    parent_source_component_id: "device",
    bom_assembly_mode: "buy",
    bom_sources: [{ supplier_name: "jlcpcb", supplier_part_number: "C456" }],
  },
  {
    type: "source_component",
    ftype: "subassembly",
    source_component_id: "internal",
    name: "Internal sensor",
    parent_source_component_id: "module",
    bom_sources: [{ supplier_name: "jlcpcb", supplier_part_number: "C789" }],
  },
]

const partsEngine: Pick<PartsEngine, "fetchPartAvailability"> = {
  fetchPartAvailability: async ({ supplierPartNumber }) => ({
    price: supplierPartNumber === "C123" ? 0.65 : 2.4,
    currency: "USD",
    stock: 1200,
    checkedAt: "2026-11-03T12:00:00Z",
  }),
}

export default () => {
  useStyles()
  return (
    <div className="rf-p-4">
      <p className="rf-mb-2 rf-text-sm">Assembly BOM · sample quotes</p>
      <BomTable circuitJson={circuitJson} partsEngine={partsEngine} />
    </div>
  )
}
