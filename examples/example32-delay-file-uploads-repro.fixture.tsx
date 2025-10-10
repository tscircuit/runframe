import { RunFrame } from "lib/components/RunFrame/RunFrame"

export default () => {
  ;(window as any).DELAY_FILE_UPLOADS = true

  const fsMap = {
    "main.tsx": `
import { partName } from "./util.ts"

circuit.add(
  <board width="10mm" height="10mm">
    <resistor name={partName} resistance="1k" footprint="0402" />
  </board>
)
`.trim(),
    "util.ts": `
export const partName = "R1"
`.trim(),
  }

  return (
    <div className="rf-space-y-3 rf-p-4">
      <div className="rf-flex rf-items-center rf-gap-4">
        <span className="rf-text-sm rf-text-muted-foreground">
          Initial run omits newly seen files for the delay to simulate staggered
          uploads, causing an import error; then it auto re-runs when the delay
          elapses since autorun is enabled.
        </span>
      </div>

      <RunFrame
        fsMap={fsMap}
        entrypoint="main.tsx"
        autorun={true}
        showRunButton={false}
        defaultActiveTab="errors"
      />
    </div>
  )
}
