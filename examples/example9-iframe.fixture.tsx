import { RunFrameWithIframe } from "lib/components/RunFrameWithIframe/RunFrameWithIframe"
import React from "react"

// NOTE: We're not passing iframeUrl which means it's going to use the
// production site iframe! This can make it difficult to test locally
// To test locally, do the following:
// 1. Run "bun run build:site" (or "bun run build:iframe" subsequently)
// 2. Run "bun run serve:cosmos"
// 3. Set the iframeUrl to "http://localhost:3000/iframe.html"
// When you're done, make sure you comment out the iframeUrl
export default () => (
  <RunFrameWithIframe
    iframeUrl="http://localhost:3000/iframe.html"
    fsMap={{
      "main.tsx": `
circuit.add(
<board width="10mm" height="10mm">
  <resistor name="R1" resistance="1k" footprint="0402" />
  <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={4} />
  <trace key="unique-key" from=".R1 .pin1" to=".C1 .pin1" width="0.2mm" layer="F.Cu" />
</board>
)
`,
    }}
    entrypoint="main.tsx"
  />
)
