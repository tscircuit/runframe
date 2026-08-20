import { expect, test } from "bun:test"
import type { PcbComponentFocusRequest } from "@tscircuit/pcb-viewer"
import {
  createNextPcbComponentFocusRequest,
  navigateToPcbComponent,
} from "../lib/components/CircuitJsonPreview/pcb-component-navigation"

test("schematic navigation switches to PCB and forwards a repeatable focus request", () => {
  let focusRequest: PcbComponentFocusRequest | undefined
  const activeTabs: string[] = []
  const setPcbComponentFocusRequest = (
    update:
      | PcbComponentFocusRequest
      | undefined
      | ((
          previous: PcbComponentFocusRequest | undefined,
        ) => PcbComponentFocusRequest | undefined),
  ) => {
    focusRequest = typeof update === "function" ? update(focusRequest) : update
  }
  const options = {
    schematicComponentId: "schematic_component_1",
    sourceComponentId: "source_component_1",
    pcbComponentId: "pcb_component_1",
  }

  navigateToPcbComponent({
    options,
    setPcbComponentFocusRequest,
    setActiveTab: (tab) => {
      activeTabs.push(tab)
    },
  })

  expect(activeTabs).toEqual(["pcb"])
  expect(focusRequest).toEqual({
    pcbComponentId: "pcb_component_1",
    requestId: 1,
  })

  navigateToPcbComponent({
    options,
    setPcbComponentFocusRequest,
    setActiveTab: (tab) => {
      activeTabs.push(tab)
    },
  })
  expect(activeTabs).toEqual(["pcb", "pcb"])
  expect(focusRequest).toEqual({
    pcbComponentId: "pcb_component_1",
    requestId: 2,
  })
  expect(
    createNextPcbComponentFocusRequest(focusRequest, "pcb_component_2"),
  ).toEqual({ pcbComponentId: "pcb_component_2", requestId: 3 })
})
