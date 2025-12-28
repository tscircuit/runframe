import { RunFrame } from "../lib/components/RunFrame/RunFrame"

// Fetch real circuit.json from example
const circuitJsonContent = await fetch(
  "https://raw.githubusercontent.com/tscircuit/circuitjson.com/94fa2b7635fd82b5e9b54de13b5a2f11b58b0611/assets/usb-c-flashlight.json",
).then((r) => r.text())

const tsxContent = `export default () => (
  <board>
    <resistor resistance="1k" footprint="0402" name="R1" />
  </board>
)`

export const WithCircuitJsonFile = () => {
  const fsMap = new Map([
    ["test.circuit.json", circuitJsonContent],
    ["index.tsx", tsxContent],
  ])

  return (
    <RunFrame
      fsMap={fsMap}
      mainComponentPath="test.circuit.json"
      defaultToFullScreen={false}
      showToggleFullScreen={true}
    />
  )
}

export const WithTsxFile = () => {
  const fsMap = new Map([
    ["test.circuit.json", circuitJsonContent],
    ["index.tsx", tsxContent],
  ])

  return (
    <RunFrame
      fsMap={fsMap}
      mainComponentPath="index.tsx"
      defaultToFullScreen={false}
      showToggleFullScreen={true}
    />
  )
}

export default {
  WithCircuitJsonFile,
  WithTsxFile,
}
