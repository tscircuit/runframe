import { RunFrame } from "lib/components/RunFrame/RunFrame"
import React from "react"

export default () => {
  return (
    <RunFrame
      fsMap={{
        "main.tsx": `
circuit.add(
  <board width="20mm" height="20mm">
    <connector name="J1" standard="usb_c" />
  </board>
)`.trim(),
      }}
      entrypoint="main.tsx"
      easyEdaProxyConfig={{
        proxyEndpointUrl: `${window.location.origin}/api/proxy`,
      }}
    />
  )
}
