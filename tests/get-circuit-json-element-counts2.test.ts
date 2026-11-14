import { expect, test } from "bun:test"
import { getCircuitJsonElementCounts } from "lib/components/RunFrameWithIframe/get-circuit-json-element-counts"

test("ignores entries without a type, and anything that is not a Circuit JSON", () => {
  expect(
    getCircuitJsonElementCounts([null, {}, { type: 3 }, { type: "pcb_via" }]),
  ).toEqual({ pcb_via: 1 })
  expect(getCircuitJsonElementCounts(null)).toEqual({})
  expect(getCircuitJsonElementCounts({ type: "pcb_board" })).toEqual({})
})
