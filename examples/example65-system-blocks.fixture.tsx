import { CircuitJsonPreview } from "../lib/components/CircuitJsonPreview/CircuitJsonPreview"
import { RunFrame } from "../lib/components/RunFrame/RunFrame"
import type { CircuitJson } from "circuit-json"
import circuitJson from "./assets/system-blocks.circuit.json"

const code =
  'import { systemblock } from "tscircuit"\n\nexport default () => (\n  <systemblock.page\n    name="overview"\n    displayName="Wireless sensor node"\n    direction="down"\n  >\n    <systemblock.group name="processing" displayName="Sensing and processing">\n      <systemblock.component\n        name="sensor"\n        displayName="Environment sensor"\n        description="Measures temperature and humidity"\n      />\n      <systemblock.component\n        name="mcu"\n        displayName="Microcontroller"\n        description="Processes readings"\n      />\n    </systemblock.group>\n    <systemblock.component\n      name="radio"\n      displayName="Radio module"\n      description="Transmits measurements"\n    />\n    <systemblock.connection\n      from="sensor"\n      to="mcu"\n      label="I2C"\n      direction="both"\n    />\n    <systemblock.connection\n      from="mcu"\n      to="radio"\n      label="SPI"\n      direction="both"\n    />\n  </systemblock.page>\n)\n'

export default {
  "Choose System from More views": (
    <CircuitJsonPreview
      circuitJson={circuitJson as CircuitJson}
      allowSelectingVersion={false}
    />
  ),
  "System only": (
    <CircuitJsonPreview
      circuitJson={circuitJson as CircuitJson}
      availableTabs={["system"]}
      defaultActiveTab="system"
      allowSelectingVersion={false}
    />
  ),
  "Live TSX": (
    <RunFrame
      fsMap={{ "index.tsx": code }}
      mainComponentPath="index.tsx"
      defaultActiveTab="system"
      showFileMenu={false}
    />
  ),
  "No system diagrams": (
    <CircuitJsonPreview
      circuitJson={[]}
      defaultActiveTab="system"
      allowSelectingVersion={false}
    />
  ),
}
