import { RunFrame } from "lib/components/RunFrame/RunFrame"

export default () => (
  <div style={{ width: "100%", maxWidth: 720, height: 500 }}>
    <RunFrame
      showRunButton
      showFileMenu={false}
      fsMap={{
        "index.tsx": `export default () => (
  <board width="10mm" height="10mm">
    <resistor name="R1" resistance="1k" footprint="0402" />
  </board>
)`,
      }}
    />
  </div>
)
