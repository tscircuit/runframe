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
    // iframeUrl="http://localhost:3000/iframe.html"
    fsMap={{
      "main.tsx": `
circuit.add(
<board width="10mm" height="10mm">
    <solderjumper name="SJ1" footprint="solderjumper2_bridged12" bridgedPins={[["1","2"]]} />
</board>
)
`,
    }}
    entrypoint="main.tsx"
  />
)
