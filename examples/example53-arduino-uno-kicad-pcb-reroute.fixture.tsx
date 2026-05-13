import { RunFrame } from "lib/components/RunFrame/RunFrame"
import { useState } from "react"
import arduinoUnoKicadPcb from "./assets/arduino-uno.source.kicad_pcb?raw"

type PcbBounds = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

const initialMainTsx = `
import { circuitJson } from "./arduino-uno.source.kicad_pcb"
circuit.add(
    <board>
      <subcircuit circuitJson={circuitJson} />
    </board>
)`.trim()

const formatCoord = (value: number) => Number(value.toFixed(3))

const createAutoroutingPhaseJsx = (region: PcbBounds) => `
      <autoroutingphase
        reroute
        region={{
          shape: "rect",
          minX: ${formatCoord(region.minX)},
          maxX: ${formatCoord(region.maxX)},
          minY: ${formatCoord(region.minY)},
          maxY: ${formatCoord(region.maxY)},
        }}
      />`

const appendAutoroutingPhase = (code: string, region: PcbBounds) => {
  const autoroutingPhase = createAutoroutingPhaseJsx(region)

  if (code.includes("</board>")) {
    return code.replace(/\n\s*<\/board>/, `\n${autoroutingPhase}\n    </board>`)
  }

  return `${code}\n${autoroutingPhase}`
}

export default () => {
  const [mainTsx, setMainTsx] = useState(initialMainTsx)

  return (
    <>
      <text>
        Click on the Bounds and drag a rectangle to reroute the region
      </text>
      <RunFrame
        fsMap={{
          "main.tsx": mainTsx,
          "arduino-uno.source.kicad_pcb": arduinoUnoKicadPcb,
        }}
        entrypoint="main.tsx"
        onPcbBoundsSelected={(bounds) => {
          setMainTsx((code) => appendAutoroutingPhase(code, bounds))
        }}
      />
    </>
  )
}
