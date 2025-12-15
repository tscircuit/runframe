import { RunFrame } from "lib/components/RunFrame/RunFrame"
import testGlbUrl from "./assets/test.glb"


export default () => {
  const projectBaseUrl = testGlbUrl.substring(0, testGlbUrl.lastIndexOf("/"))

  return (
    <RunFrame
      fsMap={{
        "main.tsx": `
import testGlb from "./test.glb"

circuit.add(
  <board>
    <chip
      name="U1"
      cadModel={<cadassembly>
        <cadmodel modelUrl={testGlb} modelUnitToMmScale={1000} positionOffset={{ x: 0, y: 0, z: 0.2 }} />
      </cadassembly>}
    />
  </board>
)
`,
        "test.glb": "__STATIC_ASSET__",
      }}
      entrypoint="main.tsx"
      projectBaseUrl={projectBaseUrl}
    />
  )
}
