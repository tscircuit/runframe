import { RunFrame } from "../lib/components/RunFrame/RunFrame"

// Fetch real circuit.json from example
const circuitJsonContent = await fetch(
  "https://raw.githubusercontent.com/tscircuit/circuitjson.com/94fa2b7635fd82b5e9b54de13b5a2f11b58b0611/assets/usb-c-flashlight.json",
).then((r) => r.text())

export const WithCircuitJsonFile = () => {
  const fsMap = new Map([["flashlight.circuit.json", circuitJsonContent]])

  return (
    <RunFrame
      fsMap={fsMap}
      mainComponentPath="flashlight.circuit.json"
      defaultToFullScreen={false}
      showToggleFullScreen={true}
    />
  )
}

export default {
  WithCircuitJsonFile,
}
