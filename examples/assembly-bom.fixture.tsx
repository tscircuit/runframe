import type { AnyCircuitElement } from "circuit-json"
import type { PartsEngine } from "@tscircuit/props"
import { useStyles } from "../lib/hooks/use-styles"
import { BomTable } from "../lib/components/BomTable"

const circuitJson: AnyCircuitElement[] = [
  {
    type: "cad_assembly_bom_item",
    cad_assembly_bom_item_id: "housing",
    name: "ABS enclosure",
    quantity: 1,
    purchase_urls: [
      "https://www.amazon.com/",
      "https://www.hammfg.com/electronics/small-case/plastic/1591",
    ],
  },
  {
    type: "cad_assembly_bom_item",
    cad_assembly_bom_item_id: "screw",
    parent_cad_assembly_bom_item_id: "housing",
    name: "M3 mounting screw",
    quantity: 4,
    purchase_urls: ["https://www.mcmaster.com/screws/"],
  },
  {
    type: "cad_assembly_bom_item",
    cad_assembly_bom_item_id: "sensor",
    parent_cad_assembly_bom_item_id: "housing",
    name: "Sensor module",
    quantity: 1,
    supplier_part_numbers: { jlcpcb: ["C456"] },
  },
  {
    type: "source_group",
    source_group_id: "power",
    subcircuit_id: "power",
    name: "Power module",
    is_subcircuit: true,
  },
  {
    type: "source_component",
    ftype: "simple_chip",
    source_component_id: "regulator",
    source_group_id: "power",
    name: "U1",
    display_name: "3.3 V regulator",
    supplier_part_numbers: { jlcpcb: ["C123", "C124"], mouser: ["ALT-123"] },
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_regulator",
    source_component_id: "regulator",
    center: { x: 0, y: 0 },
    width: 3,
    height: 3,
    rotation: 0,
    layer: "top",
    obstructs_within_bounds: true,
  },
]

const partsEngine: Pick<PartsEngine, "fetchPartAvailability"> = {
  fetchPartAvailability: async ({ supplierName, supplierPartNumber }) => {
    if (supplierName !== "jlcpcb") return undefined
    return {
      price:
        supplierPartNumber === "C456"
          ? 2.4
          : supplierPartNumber === "C124"
            ? 0.8
            : 0.65,
      currency: "USD",
      stock: 1200,
      checkedAt: "2026-11-03T12:00:00Z",
    }
  },
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
