import type { CircuitJsonElementCounts } from "./RunFrameIframeEvent"

/**
 * Counts a Circuit JSON's elements by type. A host page uses the counts to
 * tell which views have something to show (a `system_block_page` for the
 * System view, a `pcb_board` for the PCB) without receiving the whole JSON.
 */
export const getCircuitJsonElementCounts = (
  circuitJson: unknown,
): CircuitJsonElementCounts => {
  const counts: CircuitJsonElementCounts = {}
  if (!Array.isArray(circuitJson)) return counts
  for (const element of circuitJson) {
    const type = (element as { type?: unknown } | null)?.type
    if (typeof type !== "string") continue
    counts[type] = (counts[type] ?? 0) + 1
  }
  return counts
}
