import { CircuitJsonPreview } from "lib/components/CircuitJsonPreview"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => (
  <CircuitJsonPreview
    leftHeaderContent={
      <div className="flex items-center gap-2">
        <div>I can put whatever I want here!</div>
        <button
          type="button"
          className="bg-blue-500 text-white px-2 py-1 rounded-md"
        >
          Run
        </button>
      </div>
    }
    circuitJson={renderToCircuitJson(
      <board width="10mm" height="10mm">
        <resistor name="R1" resistance="1k" footprint="0402" />
      </board>,
    )}
  />
)
