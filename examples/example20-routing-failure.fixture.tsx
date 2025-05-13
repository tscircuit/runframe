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
          <chip name="U1" footprint="soic16" pcbX="0mm" pcbY="0mm" />
          <chip name="U2" footprint="soic16" pcbX="10mm" pcbY="0mm" />

          <trace from=".U1 > .pin1" to=".U2 > .pin1" />
          <trace from=".U1 > .pin2" to=".U2 > .pin2" />
          <trace from=".U1 > .pin3" to=".U2 > .pin3" />
          <trace from=".U1 > .pin4" to=".U2 > .pin4" />
          <trace from=".U1 > .pin5" to=".U2 > .pin5" />
          <trace from=".U1 > .pin6" to=".U2 > .pin6" />
          <trace from=".U1 > .pin7" to=".U2 > .pin7" />
          <trace from=".U1 > .pin8" to=".U2 > .pin8" />
          <trace from=".U1 > .pin9" to=".U2 > .pin9" />
          <trace from=".U1 > .pin10" to=".U2 > .pin10" />
          <trace from=".U1 > .pin11" to=".U2 > .pin11" />
          <trace from=".U1 > .pin12" to=".U2 > .pin12" />
          <trace from=".U1 > .pin13" to=".U2 > .pin13" />
          <trace from=".U1 > .pin14" to=".U2 > .pin14" />
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
