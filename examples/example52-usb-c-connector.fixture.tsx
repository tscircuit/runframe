import { RunFrame } from "lib/components/RunFrame/RunFrame"
import React from "react"
import { isFileApiAccessible } from "./utils/isFileApiAccessible"

export default () => {
  if (!isFileApiAccessible()) {
    return (
      <div>
        <h1>USB-C Connector</h1>
        <p>
          The EasyEDA proxy API is only available in local dev via the Vite
          middleware. Run this example locally to resolve the connector.
        </p>
      </div>
    )
  }

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
