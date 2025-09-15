import { RunFrame } from "lib/components/RunFrame/RunFrame"
import { FileSelectorCombobox } from "lib/components/RunFrameWithApi/file-selector-combobox"
import React, { useState } from "react"

export default () => {
  const [currentFile, setCurrentFile] = useState("main.tsx")

  const fsMap = {
    "main.tsx": `
circuit.add(
  <board width="80mm" height="60mm">
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={5} pcbY={5} />
    <resistor name="R2" resistance="2.2k" footprint="0402" pcbX={10} pcbY={5} />
    <resistor name="R3" resistance="4.7k" footprint="0402" pcbX={15} pcbY={5} />
    <trace from=".R1 .pin1" to=".R2 .pin1" />
    <trace from=".R2 .pin2" to=".R3 .pin1" />
    
    <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={5} pcbY={15} />
    <capacitor name="C2" capacitance="10uF" footprint="0805" pcbX={10} pcbY={15} />
    <capacitor name="C3" capacitance="100nF" footprint="0402" pcbX={15} pcbY={15} />
    
    <resistor name="R_FB1" resistance="10k" footprint="0402" pcbX={20} pcbY={20} />
    <resistor name="R_FB2" resistance="3.3k" footprint="0402" pcbX={22} pcbY={20} />
    <capacitor name="C_IN" capacitance="10uF" footprint="0805" pcbX={15} pcbY={20} />
    <capacitor name="C_OUT" capacitance="22uF" footprint="0805" pcbX={25} pcbY={20} />
    
    <resistor name="R_PULL" resistance="10k" footprint="0402" pcbX={2} pcbY={20} />
    
    <resistor name="R_LED" resistance="220" footprint="0603" pcbX={30} pcbY={10} />
    
    <resistor name="R_ROW1" resistance="1k" footprint="0402" pcbX={35} pcbY={10} />
    <resistor name="R_ROW2" resistance="1k" footprint="0402" pcbX={37} pcbY={10} />
    <resistor name="R_COL1" resistance="1k" footprint="0402" pcbX={35} pcbY={12} />
    <resistor name="R_COL2" resistance="1k" footprint="0402" pcbX={37} pcbY={12} />
  </board>
)`,

    "config.ts": `
export const boardConfig = {
  width: "80mm",
  height: "60mm",
  layers: 4
}

export const componentDefaults = {
  resistor: { footprint: "0402" },
  capacitor: { footprint: "0603" },
  led: { footprint: "0805" }
}`,

    "components/board/BoardWithComponents.tsx": `
export default () => (
  <>
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={5} pcbY={5} />
    <resistor name="R2" resistance="2.2k" footprint="0402" pcbX={10} pcbY={5} />
    <resistor name="R3" resistance="4.7k" footprint="0402" pcbX={15} pcbY={5} />
    <trace from=".R1 .pin1" to=".R2 .pin1" />
    <trace from=".R2 .pin2" to=".R3 .pin1" />
  </>
)`,

    "components/board/ResistorNetwork.tsx": `
export default () => (
  <>
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={5} pcbY={5} />
    <resistor name="R2" resistance="2.2k" footprint="0402" pcbX={10} pcbY={5} />
    <resistor name="R3" resistance="4.7k" footprint="0402" pcbX={15} pcbY={5} />
    <trace from=".R1 .pin1" to=".R2 .pin1" />
    <trace from=".R2 .pin2" to=".R3 .pin1" />
  </>
)`,

    "components/board/CapacitorBank.tsx": `
export default () => (
  <>
    <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={5} pcbY={15} />
    <capacitor name="C2" capacitance="10uF" footprint="0805" pcbX={10} pcbY={15} />
    <capacitor name="C3" capacitance="100nF" footprint="0402" pcbX={15} pcbY={15} />
  </>
)`,

    "components/power/PowerSupply.tsx": `
export default () => (
  <>
    <resistor name="R_FB1" resistance="10k" footprint="0402" pcbX={20} pcbY={20} />
    <resistor name="R_FB2" resistance="3.3k" footprint="0402" pcbX={22} pcbY={20} />
    <capacitor name="C_IN" capacitance="10uF" footprint="0805" pcbX={15} pcbY={20} />
    <capacitor name="C_OUT" capacitance="22uF" footprint="0805" pcbX={25} pcbY={20} />
    <resistor name="R_PULL" resistance="10k" footprint="0402" pcbX={2} pcbY={20} />
  </>
)`,

    "components/power/VoltageRegulator.tsx": `
export default () => (
  <>
    <resistor name="R_FB1" resistance="10k" footprint="0402" pcbX={20} pcbY={20} />
    <resistor name="R_FB2" resistance="3.3k" footprint="0402" pcbX={22} pcbY={20} />
    <capacitor name="C_IN" capacitance="10uF" footprint="0805" pcbX={15} pcbY={20} />
    <capacitor name="C_OUT" capacitance="22uF" footprint="0805" pcbX={25} pcbY={20} />
  </>
)`,

    "components/power/PowerConnector.tsx": `
export default () => (
  <resistor 
    name="R_PULL"
    resistance="10k"
    footprint="0402"
    pcbX={2}
    pcbY={20}
  />
)`,

    "components/display/LedMatrix.tsx": `
export default () => (
  <>
    <resistor name="R_LED" resistance="220" footprint="0603" pcbX={30} pcbY={10} />
    <resistor name="R_ROW1" resistance="1k" footprint="0402" pcbX={35} pcbY={10} />
    <resistor name="R_ROW2" resistance="1k" footprint="0402" pcbX={37} pcbY={10} />
    <resistor name="R_COL1" resistance="1k" footprint="0402" pcbX={35} pcbY={12} />
    <resistor name="R_COL2" resistance="1k" footprint="0402" pcbX={37} pcbY={12} />
  </>
)`,

    "components/display/drivers/LedDriver.tsx": `
export default () => (
  <resistor 
    name="R_LED"
    resistance="220"
    footprint="0603"
    pcbX={30}
    pcbY={10}
  />
)`,

    "components/display/connectors/MatrixConnector.tsx": `
export default () => (
  <>
    <resistor name="R_ROW1" resistance="1k" footprint="0402" pcbX={35} pcbY={10} />
    <resistor name="R_ROW2" resistance="1k" footprint="0402" pcbX={37} pcbY={10} />
    <resistor name="R_COL1" resistance="1k" footprint="0402" pcbX={35} pcbY={12} />
    <resistor name="R_COL2" resistance="1k" footprint="0402" pcbX={37} pcbY={12} />
  </>
)`,

    "utils/helpers.ts": `
export const calculateResistorValue = (voltage: number, current: number): number => {
  return voltage / current
}

export const calculateCapacitorValue = (frequency: number, impedance: number): number => {
  return 1 / (2 * Math.PI * frequency * impedance)
}`,

    "utils/validation/ComponentValidator.ts": `
export class ComponentValidator {
  static validateResistor(resistance: string): boolean {
    const value = parseFloat(resistance)
    return value > 0 && value < 10e6
  }
  
  static validateCapacitor(capacitance: string): boolean {
    const value = parseFloat(capacitance)
    return value > 0 && value < 1000
  }
}`,

    "tests/components/ResistorNetwork.test.ts": `
import { ComponentValidator } from "../../utils/validation/ComponentValidator"

describe("ResistorNetwork", () => {
  test("validates resistor values", () => {
    expect(ComponentValidator.validateResistor("1k")).toBe(true)
    expect(ComponentValidator.validateResistor("0")).toBe(false)
  })
})`,

    "tests/integration/FullBoard.test.ts": `
describe("Full Board Integration", () => {
  test("board renders without errors", () => {
    // Integration test for complete board
    expect(true).toBe(true)
  })
})`,
  }

  const files = Object.keys(fsMap)

  return (
    <RunFrame
      fsMap={fsMap}
      entrypoint="main.tsx"
      mainComponentPath={currentFile}
      leftHeaderContent={
        <div className="rf-absolute rf-left-1/2 rf-transform rf--translate-x-1/2">
          <FileSelectorCombobox
            currentFile={currentFile}
            files={files}
            onFileChange={(value) => {
              setCurrentFile(value)
            }}
          />
        </div>
      }
    />
  )
}
