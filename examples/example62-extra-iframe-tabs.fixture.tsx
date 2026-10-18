import { useState } from "react"
import { RunFrame } from "../lib/components/RunFrame/RunFrame"

const fsMap = {
  "configured.circuit.json": "[]",
  "other.circuit.json": "[]",
}

export default function ExtraIframeTabs() {
  const [path, setPath] = useState("configured.circuit.json")
  return (
    <div style={{ height: 760, padding: 16 }}>
      <p style={{ margin: "0 0 12px", fontFamily: "system-ui" }}>
        Iframe transport demo. Open UART and its details, switch to PCB, then
        select Sysconfig in More views. Switching circuits removes the scoped
        tab.
      </p>
      <RunFrame
        fsMap={fsMap}
        mainComponentPath={path}
        defaultActiveTab="extra:Sysconfig"
        showFileMenu={false}
        showToggleFullScreen
        extraTabs={[
          {
            tabName: "Sysconfig",
            iframeUrl: new URL(
              "/extra-runframe-tabs-demo.html",
              window.location.href,
            ).href,
            mainComponentPath: "configured.circuit.json",
          },
        ]}
        leftHeaderContent={
          <select
            aria-label="Circuit"
            value={path}
            onChange={(event) => setPath(event.target.value)}
          >
            <option value="configured.circuit.json">
              Circuit with configuration
            </option>
            <option value="other.circuit.json">
              Circuit without configuration
            </option>
          </select>
        }
      />
    </div>
  )
}
