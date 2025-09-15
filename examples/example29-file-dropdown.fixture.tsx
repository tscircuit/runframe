import { RunFrame } from "lib/components/RunFrame/RunFrame"
import { FileSelectorCombobox } from "lib/components/RunFrameWithApi/file-selector-combobox"
import React, { useState } from "react"

export default () => {
  const [currentFile, setCurrentFile] = useState("main.tsx")

  const fsMap = {
    "main.tsx": `
circuit.add(
  <board width="20mm" height="20mm">
    <resistor name="R1" resistance="1k" footprint="0402" />
  </board>
)`,
    "config.ts": `export const boardConfig = { width: "20mm", height: "20mm" }`,

    "components/Resistor.tsx": `export const Resistor = () => <resistor name="R1" resistance="1k" />`,
    "components/Capacitor.tsx": `export const Capacitor = () => <capacitor name="C1" capacitance="10uF" />`,

    "circuits/power/VoltageRegulator.tsx": `export const VoltageRegulator = () => <resistor name="R_REG" resistance="10k" />`,
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
