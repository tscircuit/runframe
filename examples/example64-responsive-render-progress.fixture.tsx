import { CircuitJsonPreview } from "lib/components/CircuitJsonPreview/CircuitJsonPreview"
import { EnhancedFileSelectorCombobox } from "lib/components/RunFrameWithApi/EnhancedFileSelectorCombobox"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"
import { useState } from "react"

const circuitJson = renderToCircuitJson(
  <board width="10mm" height="10mm">
    <resistor name="R1" resistance="1k" footprint="0402" />
  </board>,
)

const files = [
  "boards/VeryLongUnbrokenResponsivePowerSupplyBoardFilenameForTesting.tsx",
  "boards/ShortBoard.tsx",
]

const stages = [
  { phase: "pcb", progress: 0.099 },
  { phase: "Rendering a particularly long phase name", progress: 0.1 },
  { phase: "schematic", progress: 0.999 },
  { phase: "finishing", progress: 0.99999 },
  { phase: "complete", progress: 1 },
] as const

export default () => {
  const [stage, setStage] = useState(0)
  const [currentFile, setCurrentFile] = useState(files[0])
  const current = stages[stage]
  return (
    <>
      <CircuitJsonPreview
        circuitJson={circuitJson}
        leftHeaderContent={
          <div className="rf-flex rf-min-w-0 rf-w-full rf-items-center rf-gap-2">
            <span className="rf-inline-flex rf-size-2 rf-shrink-0 rf-rounded-full rf-bg-green-600" />
            <div className="rf-min-w-0 rf-flex-1">
              <EnhancedFileSelectorCombobox
                files={files}
                currentFile={currentFile}
                onFileChange={setCurrentFile}
              />
            </div>
          </div>
        }
        renderLog={{
          progress: current.progress,
          lastRenderEvent: {
            type: "board:renderPhaseStarted",
            phase: current.phase,
            renderId: "responsive-fixture",
            eventsProcessed: 1,
            createdAt: 0,
          },
        }}
      />
      <button
        type="button"
        onClick={() => setStage((stage + 1) % stages.length)}
        style={{ position: "fixed", bottom: 8, left: 8, zIndex: 100 }}
      >
        Next render stage
      </button>
    </>
  )
}
