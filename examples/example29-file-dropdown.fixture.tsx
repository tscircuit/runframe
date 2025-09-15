import { RunFrameForCli } from "lib/components/RunFrameForCli/RunFrameForCli";
import { RunFrameWithApi } from "lib/components/RunFrameWithApi/RunFrameWithApi";
import { useRunFrameStore } from "lib/components/RunFrameWithApi/store";
import { useState, useEffect } from "react";
import { DebugEventsTable } from "./utils/DebugEventsTable.tsx";
import { useEventHandler } from "lib/components/RunFrameForCli/useEventHandler";
import { isFileApiAccessible } from "./utils/isFileApiAccessible.ts";

export default () => {
  const recentEvents = useRunFrameStore((state) => state.recentEvents);
  const pushEvent = useRunFrameStore((state) => state.pushEvent);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.TSCIRCUIT_REGISTRY_API_BASE_URL = `${window.location.origin}/registry`;
      window.TSCIRCUIT_REGISTRY_TOKEN =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiYWNjb3VudC0xMjM0IiwiZ2l0aHViX3VzZXJuYW1lIjoidGVzdHVzZXIiLCJzZXNzaW9uX2lkIjoic2Vzc2lvbi0xMjM0IiwidG9rZW4iOiIxMjM0In0.KvHMnB_ths0mI-f8Tj-t-OTOGRUPOEbFunima0dgMcQ";
    }
  }, []);

  useEventHandler(async (event) => {
    if (event.event_type === "REQUEST_TO_SAVE_SNIPPET") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!event.snippet_name) {
        pushEvent({
          event_type: "FAILED_TO_SAVE_SNIPPET",
          error_code: "SNIPPET_UNSET",
          available_snippet_names: [
            "enhanced-file-dropdown-test",
            "complex-nested-structure",
            "folder-organization-demo",
          ],
        });
      } else {
        pushEvent({
          event_type: "SNIPPET_SAVED",
        });
      }
    }
  });

  useEffect(() => {
    setTimeout(async () => {
      fetch("/api/events/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const filesToCreate = [
        {
          file_path: "main.tsx",
          text_content: `
import { BoardWithComponents } from "./components/board/BoardWithComponents"
import { PowerSupply } from "./components/power/PowerSupply"
import { LedMatrix } from "./components/display/LedMatrix"

export default () => (
  <board width="80mm" height="60mm">
    <BoardWithComponents />
    <PowerSupply />
    <LedMatrix />
  </board>
)`,
        },
        {
          file_path: "config.ts",
          text_content: `
export const boardConfig = {
  width: "80mm",
  height: "60mm",
  layers: 4
}

export const componentDefaults = {
  resistor: { footprint: "0402" },
  capacitor: { footprint: "0603" },
  led: { footprint: "0805" }
}`,
        },
        {
          file_path: "components/board/BoardWithComponents.tsx",
          text_content: `
import { ResistorNetwork } from "./ResistorNetwork"
import { CapacitorBank } from "./CapacitorBank"

export const BoardWithComponents = () => (
  <>
    <ResistorNetwork />
    <CapacitorBank />
  </>
)`,
        },
        {
          file_path: "components/board/ResistorNetwork.tsx",
          text_content: `
export const ResistorNetwork = () => (
  <>
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={5} pcbY={5} />
    <resistor name="R2" resistance="2.2k" footprint="0402" pcbX={10} pcbY={5} />
    <resistor name="R3" resistance="4.7k" footprint="0402" pcbX={15} pcbY={5} />
    <trace from=".R1 .pin1" to=".R2 .pin1" />
    <trace from=".R2 .pin2" to=".R3 .pin1" />
  </>
)`,
        },
        {
          file_path: "components/board/CapacitorBank.tsx",
          text_content: `
export const CapacitorBank = () => (
  <>
    <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={5} pcbY={15} />
    <capacitor name="C2" capacitance="10uF" footprint="0805" pcbX={10} pcbY={15} />
    <capacitor name="C3" capacitance="100nF" footprint="0402" pcbX={15} pcbY={15} />
  </>
)`,
        },
        {
          file_path: "components/power/PowerSupply.tsx",
          text_content: `
import { VoltageRegulator } from "./VoltageRegulator"
import { PowerConnector } from "./PowerConnector"

export const PowerSupply = () => (
  <>
    <PowerConnector />
    <VoltageRegulator />
  </>
)`,
        },
        {
          file_path: "components/power/VoltageRegulator.tsx",
          text_content: `
export const VoltageRegulator = () => (
  <>
    <resistor name="R_FB1" resistance="10k" footprint="0402" pcbX={20} pcbY={20} />
    <resistor name="R_FB2" resistance="3.3k" footprint="0402" pcbX={22} pcbY={20} />
    <capacitor name="C_IN" capacitance="10uF" footprint="0805" pcbX={15} pcbY={20} />
    <capacitor name="C_OUT" capacitance="22uF" footprint="0805" pcbX={25} pcbY={20} />
  </>
)`,
        },
        {
          file_path: "components/power/PowerConnector.tsx",
          text_content: `
export const PowerConnector = () => (
  <resistor 
    name="R_PULL"
    resistance="10k"
    footprint="0402"
    pcbX={2}
    pcbY={20}
  />
)`,
        },

        {
          file_path: "components/display/LedMatrix.tsx",
          text_content: `
import { LedDriver } from "./drivers/LedDriver"
import { MatrixConnector } from "./connectors/MatrixConnector"

export const LedMatrix = () => (
  <>
    <LedDriver />
    <MatrixConnector />
  </>
)`,
        },
        {
          file_path: "components/display/drivers/LedDriver.tsx",
          text_content: `
export const LedDriver = () => (
  <resistor 
    name="R_LED"
    resistance="220"
    footprint="0603"
    pcbX={30}
    pcbY={10}
  />
)`,
        },
        {
          file_path: "components/display/connectors/MatrixConnector.tsx",
          text_content: `
export const MatrixConnector = () => (
  <>
    <resistor name="R_ROW1" resistance="1k" footprint="0402" pcbX={35} pcbY={10} />
    <resistor name="R_ROW2" resistance="1k" footprint="0402" pcbX={37} pcbY={10} />
    <resistor name="R_COL1" resistance="1k" footprint="0402" pcbX={35} pcbY={12} />
    <resistor name="R_COL2" resistance="1k" footprint="0402" pcbX={37} pcbY={12} />
  </>
)`,
        },

        {
          file_path: "utils/helpers.ts",
          text_content: `
export const calculateResistorValue = (voltage: number, current: number): number => {
  return voltage / current
}

export const calculateCapacitorValue = (frequency: number, impedance: number): number => {
  return 1 / (2 * Math.PI * frequency * impedance)
}`,
        },
        {
          file_path: "utils/validation/ComponentValidator.ts",
          text_content: `
export class ComponentValidator {
  static validateResistor(resistance: string): boolean {
    const value = parseFloat(resistance)
    return value > 0 && value < 10e6
  }
  
  static validateCapacitor(capacitance: string): boolean {
    const value = parseFloat(capacitance)
    return value > 0 && value < 1000
  }
}`,
        },
        {
          file_path: "tests/components/ResistorNetwork.test.ts",
          text_content: `
import { ComponentValidator } from "../../utils/validation/ComponentValidator"

describe("ResistorNetwork", () => {
  test("validates resistor values", () => {
    expect(ComponentValidator.validateResistor("1k")).toBe(true)
    expect(ComponentValidator.validateResistor("0")).toBe(false)
  })
})`,
        },
        {
          file_path: "tests/integration/FullBoard.test.ts",
          text_content: `
describe("Full Board Integration", () => {
  test("board renders without errors", () => {
    // Integration test for complete board
    expect(true).toBe(true)
  })
})`,
        },
        {
          file_path: "manual-edits.json",
          text_content: JSON.stringify({}),
        },
      ];

      for (const fileData of filesToCreate) {
        await fetch("/api/files/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fileData),
        });
      }
    }, 500);
  }, []);

  if (!isFileApiAccessible()) {
    return (
      <div>
        <h1>Enhanced File Dropdown Test</h1>
        <p>
          We don't currently deploy the API to vercel, try locally! The vite
          plugin will automatically load it.
        </p>
      </div>
    );
  }

  return (
    <>
      <RunFrameForCli debug />
      <DebugEventsTable />
    </>
  );
};
