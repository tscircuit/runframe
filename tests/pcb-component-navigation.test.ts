import { expect, test } from "bun:test"
import type { PcbComponentFocusRequest } from "@tscircuit/pcb-viewer"
import {
  createNextPcbComponentFocusRequest,
  isPcbNavigationAvailable,
  navigateToPcbComponent,
} from "../lib/components/CircuitJsonPreview/pcb-component-navigation"

test("PCB navigation follows the available tabs", () => {
  expect(isPcbNavigationAvailable()).toBe(true)
  expect(isPcbNavigationAvailable(["schematic", "pcb"])).toBe(true)
  expect(isPcbNavigationAvailable(["schematic"])).toBe(false)
})

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
    if (typeof update === "function") {
      focusRequest = update(focusRequest)
    } else {
      focusRequest = update
    }
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
