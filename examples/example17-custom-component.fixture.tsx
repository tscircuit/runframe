import { RunFrame } from "lib/components/RunFrame/RunFrame"

export default () => (
  <RunFrame
    fsMap={{
      "index.tsx": `
export default () => (
  <board width="10mm" height="10mm">
    <resistor resistance="1k" footprint="0402" name="E1" />
  </board>
);
`,
      "component.tsx": `
export default () => (
  <board width="10mm" height="10mm">
    <resistor resistance="1k" footprint="0402" name="F1" />
  </board>
);
`,
    }}
    mainComponentPath="component.tsx"
  />
)
