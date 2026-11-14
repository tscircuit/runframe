import { expect, test } from "bun:test"
import { getCircuitJsonElementCounts } from "lib/components/RunFrameWithIframe/get-circuit-json-element-counts"

test("counts Circuit JSON elements by type", () => {
  expect(
    getCircuitJsonElementCounts([
      { type: "pcb_board" },
      { type: "pcb_component" },
      { type: "pcb_component" },
      { type: "system_block_page" },
    ]),
  ).toEqual({ pcb_board: 1, pcb_component: 2, system_block_page: 1 })
})

test("ignores entries without a type, and anything that is not a Circuit JSON", () => {
  expect(
    getCircuitJsonElementCounts([null, {}, { type: 3 }, { type: "pcb_via" }]),
  ).toEqual({ pcb_via: 1 })
  expect(getCircuitJsonElementCounts(null)).toEqual({})
  expect(getCircuitJsonElementCounts({ type: "pcb_board" })).toEqual({})
})
