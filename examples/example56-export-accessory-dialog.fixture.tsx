import type { CircuitJson } from "circuit-json"
import { ExportAccessoryDialog } from "lib/components/ExportAccessoryDialog"

const circuitJson = [
  {
    type: "source_component",
    source_component_id: "source_r1",
    name: "R1",
    ftype: "simple_resistor",
    resistance: "10k",
  },
  {
    type: "source_component",
    source_component_id: "source_r2",
    name: "R2",
    ftype: "simple_resistor",
    resistance: "10k",
  },
  {
    type: "source_component",
    source_component_id: "source_c1",
    name: "C1",
    ftype: "simple_capacitor",
    capacitance: "100nF",
  },
  {
    type: "source_component",
    source_component_id: "source_u1",
    name: "U1",
    ftype: "simple_chip",
  },
  ...["r1", "r2", "c1", "u1"].map((refdes, index) => ({
    type: "pcb_component" as const,
    pcb_component_id: `pcb_${refdes}`,
    source_component_id: `source_${refdes}`,
    center: { x: index * 4, y: 0 },
    layer: "top" as const,
    rotation: 0,
    width: 3,
    height: 2,
  })),
] as CircuitJson

export default () => (
  <ExportAccessoryDialog
    open
    onOpenChange={() => {}}
    circuitJson={circuitJson}
    projectName="accessory-dialog-example"
  />
)
