import evalWebWorkerBlobUrl from "@tscircuit/eval/blob-url"
import { RunFrame } from "lib/components/RunFrame/RunFrame"
import { useMemo, useState } from "react"

// Based on docs.tscircuit.com/elements/assembly-printedpart.
const spacerGeometry = `
import { assembly, jscad } from "tscircuit"

const holeCenters = [-15.5, 15.5].flatMap((x) =>
  [-15.5, 15.5].map((y) => [x, y]),
)

function MotorSpacer() {
  return (
    <>
      <jscad.subtract>
        <jscad.union>
          <jscad.cuboid size={[42, 42, 4]} center={[0, 0, 2]} />
          {holeCenters.map(([x, y]) => (
            <jscad.cylinder key={x + "," + y} radius={4} height={10}
              center={[x, y, 5]} />
          ))}
        </jscad.union>
        <jscad.cylinder radius={15} height={12} center={[0, 0, 5]} />
        {holeCenters.map(([x, y]) => (
          <jscad.cylinder key={x + "," + y} radius={1.6} height={12}
            center={[x, y, 5]} />
        ))}
      </jscad.subtract>
      <jscad.rotate angles={[0, Math.PI, 0]}>
        <jscad.rectangle name="motor" size={[42, 42]} reference />
      </jscad.rotate>
      <jscad.translate offset={[0, 0, 10]}>
        <jscad.rectangle name="board" size={[42, 42]} reference />
      </jscad.translate>
    </>
  )
}
`

const AssemblyStepExample = ({ multipleParts = false }) => {
  const [ready, setReady] = useState(false)
  const fsMap = useMemo(
    () => ({
      "spacer.tsx": `${spacerGeometry}
circuit.add(
  <assembly.device>
    <assembly.printedpart name="SPACER" jscad={<MotorSpacer />} />
    ${
      multipleParts
        ? `<assembly.printedpart name="SECOND_SPACER" jscad={
      <jscad.translate offset={[55, 0, 0]}>
        <MotorSpacer />
      </jscad.translate>
    } />`
        : ""
    }
  </assembly.device>
)
`,
    }),
    [multipleParts],
  )

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <p style={{ margin: "12px 16px" }}>
        Open File → Export → Assembly STEP to download the printed parts. The
        spacer is 42 × 42 × 10 mm, with a 30 mm center opening and four 3.2 mm
        screw holes. {ready ? "Ready to export." : "Rendering printed parts…"}
      </p>
      <div style={{ flex: 1, minHeight: 0 }}>
        <RunFrame
          fsMap={fsMap}
          entrypoint="spacer.tsx"
          evalWebWorkerBlobUrl={evalWebWorkerBlobUrl}
          evalVersion="0.0.1588"
          onRenderFinished={() => setReady(true)}
          defaultTab="cad"
        />
      </div>
    </div>
  )
}

export default {
  "Printed spacer without a PCB": () => <AssemblyStepExample />,
  "Two printed spacers": () => <AssemblyStepExample multipleParts />,
}
