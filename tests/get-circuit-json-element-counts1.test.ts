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
