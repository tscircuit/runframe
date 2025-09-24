import { RunFrameWithApi } from "lib/components/RunFrameWithApi/RunFrameWithApi"
import { useRunFrameStore } from "lib/components/RunFrameWithApi/store"
import { useState, useEffect } from "react"
import { DebugEventsTable } from "./utils/DebugEventsTable"
import { isFileApiAccessible } from "./utils/isFileApiAccessible.ts"

export default () => {
  const recentEvents = useRunFrameStore((state) => state.recentEvents)

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.TSCIRCUIT_REGISTRY_API_BASE_URL = `${window.location.origin}/registry`
      window.TSCIRCUIT_REGISTRY_TOKEN =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiYWNjb3VudC0xMjM0IiwiZ2l0aHViX3VzZXJuYW1lIjoidGVzdHVzZXIiLCJzZXNzaW9uX2lkIjoic2Vzc2lvbi0xMjM0IiwidG9rZW4iOiIxMjM0In0.KvHMnB_ths0mI-f8Tj-t-OTOGRUPOEbFunima0dgMcQ"
    }
  }, [])

  useEffect(() => {
    setTimeout(async () => {
      // Reset events
      fetch("/api/events/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      // Create a nested file structure for testing
      const filesToCreate = [
        {
          path: "main.tsx",
          content: `
import manualEdits from "./manual-edits.json"
import { PowerModule } from "./modules/power/PowerModule"
import { LedMatrix } from "./components/display/LedMatrix"
import { SensorArray } from "./sensors/SensorArray"

export default () => (
  <board width="50mm" height="40mm" manualEdits={manualEdits}>
    <PowerModule />
    <LedMatrix size="16x16" />
    <SensorArray count={4} />
    <trace from=".PowerModule .vout" to=".LedMatrix .vin" />
  </board>
)`,
        },
        {
          path: "manual-edits.json",
          content: JSON.stringify({}),
        },
        {
          path: "components/display/LedMatrix.tsx",
          content: `
export const LedMatrix = ({ size }: { size: string }) => (
  <group name="LedMatrix">
    <chip name="led_driver" footprint="TQFP-48" />
    <resistor name="R_current" resistance="220" footprint="0603" />
  </group>
)`,
        },
        {
          path: "components/display/DisplayDriver.tsx",
          content: `
export const DisplayDriver = () => (
  <group name="DisplayDriver">
    <chip name="display_controller" footprint="QFN-32" />
    <capacitor name="C_bypass" capacitance="100nF" footprint="0402" />
  </group>
)`,
        },
        {
          path: "components/interface/UsbConnector.tsx",
          content: `
export const UsbConnector = () => (
  <group name="UsbConnector">
    <chip name="usb_controller" footprint="QFN-28" />
    <resistor name="R_pullup" resistance="1.5k" footprint="0402" />
  </group>
)`,
        },
        {
          path: "modules/power/PowerModule.tsx",
          content: `
export const PowerModule = () => (
  <group name="PowerModule">
    <chip name="voltage_regulator" footprint="SOT-23-5" />
    <capacitor name="C_in" capacitance="10uF" footprint="0805" />
    <capacitor name="C_out" capacitance="22uF" footprint="0805" />
    <inductor name="L1" inductance="2.2uH" footprint="0603" />
  </group>
)`,
        },
        {
          path: "modules/power/BatteryManager.tsx",
          content: `
export const BatteryManager = () => (
  <group name="BatteryManager">
    <chip name="battery_charger" footprint="QFN-16" />
    <resistor name="R_sense" resistance="0.1" footprint="1206" />
  </group>
)`,
        },
        {
          path: "sensors/SensorArray.tsx",
          content: `
export const SensorArray = ({ count }: { count: number }) => (
  <group name="SensorArray">
    {Array.from({ length: count }, (_, i) => (
      <chip key={i} name={\`sensor_\${i}\`} footprint="LGA-12" />
    ))}
  </group>
)`,
        },
        {
          path: "sensors/TemperatureSensor.tsx",
          content: `
export const TemperatureSensor = () => (
  <group name="TemperatureSensor">
    <chip name="temp_sensor" footprint="SOT-23-3" />
    <resistor name="R_pullup" resistance="10k" footprint="0402" />
  </group>
)`,
        },
        {
          path: "utils/helpers.ts",
          content: `
export const calculateResistance = (voltage: number, current: number) => voltage / current

export const convertToOhms = (value: string) => {
  // Convert k, M, etc. to base ohms
  if (value.endsWith('k')) return parseFloat(value) * 1000
  if (value.endsWith('M')) return parseFloat(value) * 1000000
  return parseFloat(value)
}`,
        },
        {
          path: "utils/constants.ts",
          content: `
export const STANDARD_VOLTAGES = [3.3, 5.0, 12.0, 24.0]
export const STANDARD_RESISTANCES = ['1k', '10k', '100k', '1M']
export const COMMON_FOOTPRINTS = ['0402', '0603', '0805', '1206']`,
        },
        {
          path: "tests/power.test.tsx",
          content: `
import { PowerModule } from '../modules/power/PowerModule'

describe('PowerModule', () => {
  it('should render voltage regulator', () => {
    // Test implementation
  })
})`,
        },
        {
          path: "docs/README.md",
          content: `# Project Documentation\n\nThis is a sample project demonstrating the enhanced file selector.`,
        },
        {
          path: "docs/api/endpoints.md",
          content: `# API Endpoints\n\n## File Operations\n- GET /api/files\n- POST /api/files/upsert`,
        },
        {
          path: "docs/components/display.md",
          content: `# Display Components\n\nDocumentation for LED matrix and display driver components.`,
        },
        {
          path: "config/development.json",
          content: JSON.stringify(
            { debug: true, apiUrl: "http://localhost:3000" },
            null,
            2,
          ),
        },
        {
          path: "config/production.json",
          content: JSON.stringify(
            { debug: false, apiUrl: "https://api.example.com" },
            null,
            2,
          ),
        },
        {
          path: "assets/images/logo.svg",
          content: `<svg><circle r="10" fill="blue"/></svg>`,
        },
        {
          path: "assets/styles/main.css",
          content: `.container { max-width: 1200px; margin: 0 auto; }`,
        },
        {
          path: "components/display/icons/PowerIcon.tsx",
          content: `export const PowerIcon = () => <svg><path d="M8 12l4-4 4 4"/></svg>`,
        },
        {
          path: "components/display/icons/BatteryIcon.tsx",
          content: `export const BatteryIcon = () => <svg><rect width="20" height="10"/></svg>`,
        },
        {
          path: "modules/communication/WifiModule.tsx",
          content: `export const WifiModule = () => (\n  <group name="WifiModule">\n    <chip name="wifi_chip" footprint="QFN-32" />\n  </group>\n)`,
        },
        {
          path: "modules/communication/BluetoothModule.tsx",
          content: `export const BluetoothModule = () => (\n  <group name="BluetoothModule">\n    <chip name="bt_chip" footprint="BGA-64" />\n  </group>\n)`,
        },
        {
          path: "tests/integration/full-system.test.tsx",
          content: `import { PowerModule } from '../../modules/power/PowerModule'\n\ndescribe('Full System Integration', () => {\n  it('should work end-to-end', () => {\n    // Integration test\n  })\n})`,
        },
        {
          path: "tests/unit/utils.test.ts",
          content: `import { calculateResistance } from '../../utils/helpers'\n\ndescribe('Utils', () => {\n  it('should calculate resistance correctly', () => {\n    expect(calculateResistance(5, 0.1)).toBe(50)\n  })\n})`,
        },
        {
          path: "scripts/build.sh",
          content: `#!/bin/bash\necho "Building project..."\nnpm run build`,
        },
        {
          path: "scripts/deploy.sh",
          content: `#!/bin/bash\necho "Deploying project..."\nnpm run deploy`,
        },
      ]

      // Create all files
      for (const file of filesToCreate) {
        await fetch("/api/files/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_path: file.path,
            text_content: file.content,
          }),
        })
      }
    }, 500)
  }, [])

  if (!isFileApiAccessible()) {
    return (
      <div className="rf-p-8">
        <h1 className="rf-text-2xl rf-font-bold rf-mb-4">
          Enhanced File Selector Example
        </h1>
        <p className="rf-text-muted-foreground">
          We don't currently deploy the API to vercel, try locally! The vite
          plugin will automatically load it.
        </p>
      </div>
    )
  }

  return (
    <div className="rf-h-screen rf-flex rf-flex-col">
      <div className="rf-p-4 rf-border-b rf-bg-muted/50">
        <h1 className="rf-text-xl rf-font-semibold">Enhanced File Selector</h1>
      </div>

      <div className="rf-flex-1">
        <RunFrameWithApi debug showFilesSwitch showFileMenu />
      </div>

      <div className="rf-max-h-48 rf-overflow-auto rf-border-t">
        <DebugEventsTable />
      </div>
    </div>
  )
}
