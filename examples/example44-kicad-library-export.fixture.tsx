import { RunFrame } from "lib/components/RunFrame/RunFrame"
// @ts-ignore
import stepFileUrl from "./assets/SW_Push_1P1T_NO_CK_KMR2.step"

export default () => {
  const projectBaseUrl = stepFileUrl.substring(0, stepFileUrl.lastIndexOf("/"))

  return (
    <RunFrame
      fsMap={{
        "main.tsx": `
import stepUrl from "./SW_Push_1P1T_NO_CK_KMR2.step"

export default () => (
  <board width="20mm" height="20mm">
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
    <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={0} />
    <chip
      name="SW1"
      footprint="pushbutton"
      pcbX={5}
      cadModel={{
        modelUrl: stepUrl,
        rotationOffset: { x: 0, y: 0, z: 270 },
        positionOffset: { x: 0.5, y: -0.3, z: 0 },
      }}
    />
    <trace from=".R1 .pin2" to=".C1 .pin1" />
  </board>
)
`,
        "SW_Push_1P1T_NO_CK_KMR2.step": "__STATIC_ASSET__",
      }}
      entrypoint="main.tsx"
      projectBaseUrl={projectBaseUrl}
    />
  )
}
