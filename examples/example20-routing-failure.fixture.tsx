import { CircuitJsonPreview } from "lib/components/CircuitJsonPreview/CircuitJsonPreview"
import {
  fullRenderToCircuitJson,
  renderToCircuitJson,
} from "lib/dev/render-to-circuit-json"
import { useEffect, useState } from "react"

export default () => {
  const [circuitJson, setCircuitJson] = useState<CircuitJson | null>(null)

  useEffect(() => {
    const fetchCircuitJson = async () => {
      const circuitJson = await fullRenderToCircuitJson(
        <board>
          <resistor
            name="R1"
            resistance="10k"
            footprint="0402"
            pcbX="5mm"
            pcbY="5mm"
          />
          <resistor
            name="R2"
            resistance="4.7k"
            footprint="0402"
            pcbX="6mm"
            pcbY="6mm"
          />
          <resistor
            name="R3"
            resistance="4.7k"
            footprint="0402"
            pcbX="7mm"
            pcbY="7mm"
          />
          <resistor
            name="R4"
            resistance="4.7k"
            footprint="0603"
            pcbX="4mm"
            pcbY="4mm"
          />
          {/* Add a trace connecting the two resistors to trigger routing failure */}
          <trace from=".R1 > .pin1" to=".R2 > .pin2" />
          <trace from=".R1 > .pin2" to=".R2 > .pin1" />
          <trace from=".R1 > .pin2" to=".R3 > .pin1" />
          <trace from=".R1 > .pin2" to=".R4 > .pin1" />
        </board>,
      )
      setCircuitJson(circuitJson)
    }
    fetchCircuitJson()
  }, [])

  if (!circuitJson) {
    return <div>Loading...</div>
  }

  return <CircuitJsonPreview circuitJson={circuitJson} />
}
