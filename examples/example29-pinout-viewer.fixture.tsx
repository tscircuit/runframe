import { RunFrame } from "lib/components/RunFrame/RunFrame"

export default () => (
  <RunFrame
    fsMap={{
      "main.tsx": `
circuit.add(
  <board width="50mm" height="50mm">
    <chip
      name="D1"
      footprint="soic8"
      pinLabels={{
        "1": "VCC",
        "2": "GND",
        "8": "OUT",
      }}
      pinAttributes={{
        "1": {
          includeInBoardPinout: true,
        },
        "2": {
          includeInBoardPinout: true,
          pinoutDisplayName: "Ground",
        },
        "8": {
          includeInBoardPinout: true,
        },
      }}
    />
    <chip
      name="U1"
      footprint="dip14"
      pcbX="20mm"
      pinLabels={{
        "7": "GND",
        "14": "VCC",
      }}
      pinAttributes={{
        "14": {
          includeInBoardPinout: true,
        },
      }}
    />
    <chip
      name="J1"
      footprint="pinrow4"
      pcbX="-20mm"
      pcbY="23.8mm"
      pinLabels={{
        "1": "5V",
        "4": "GND",
      }}
      pinAttributes={{
        "1": {
          includeInBoardPinout: true,
          pinoutDisplayName: "5V Power",
        },
        "4": {
          includeInBoardPinout: true,
        },
      }}
    />
  </board>
)
`,
    }}
    entrypoint="main.tsx"
    defaultActiveTab="pinout"
    availableTabs={["pcb", "schematic", "cad", "pinout"]}
  />
)
