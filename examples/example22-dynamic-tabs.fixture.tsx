import { RunFrame } from "lib/components/RunFrame/RunFrame"
import type { TabId } from "lib/components/CircuitJsonPreview/PreviewContentProps"
import React, { useState } from "react"

export default () => {
  const allTabs: TabId[] = [
    "pcb",
    "schematic",
    "assembly",
    "cad",
    "bom",
    "circuit_json",
    "errors",
    "render_log",
  ]
  const [availableTabs, setAvailableTabs] = useState<TabId[]>([
    "pcb",
    "schematic",
    "cad",
  ])
  const [defaultTab, setDefaultTab] = useState<TabId>("pcb")

  const toggleTab = (tab: TabId) => {
    setAvailableTabs((prev) =>
      prev.includes(tab) ? prev.filter((t) => t !== tab) : [...prev, tab],
    )
  }

  return (
    <div className="rf-space-y-4 rf-p-4">
      <div>
        <h3 className="rf-font-semibold rf-mb-2">Configure Tabs</h3>
        <div className="rf-flex rf-flex-wrap rf-gap-2">
          {allTabs.map((tab) => (
            <label key={tab} className="rf-flex rf-items-center rf-space-x-1">
              <input
                type="checkbox"
                checked={availableTabs.includes(tab)}
                onChange={() => toggleTab(tab)}
              />
              <span>{tab}</span>
            </label>
          ))}
        </div>
        <div className="rf-mt-2">
          <label className="rf-mr-2">Default Tab:</label>
          <select
            value={defaultTab}
            onChange={(e) => setDefaultTab(e.target.value as TabId)}
          >
            {availableTabs.map((tab) => (
              <option key={tab} value={tab}>
                {tab}
              </option>
            ))}
          </select>
        </div>
      </div>
      <RunFrame
        fsMap={{
          "main.tsx": `
import { Fragment } from "react"

circuit.add(
  <board width="10mm" height="10mm">
    <resistor name="R1" resistance="1k" footprint="0402" />
    <trace from=".R1 > .pin1" to=".R1 > .pin2" />
  </board>
)
`,
        }}
        entrypoint="main.tsx"
        availableTabs={availableTabs}
        defaultTab={defaultTab}
        showRunButton
      />
    </div>
  )
}
