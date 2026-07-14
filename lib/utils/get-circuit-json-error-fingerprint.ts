/**
 * Derive a stable PostHog error-tracking fingerprint for a circuit-JSON error.
 *
 * Circuit-JSON DRC error messages interpolate per-trace / per-component display
 * names (e.g. `Trace [.U1 > .GND to .J1 > .pin2] is not connected (it has no PCB
 * trace)`). If those messages are captured verbatim, PostHog computes a brand-new
 * fingerprint for every distinct trace, spawning thousands of near-identical
 * issues for what is really a single DRC condition (e.g. an autorouter that
 * failed to route). Grouping by `error_type` collapses each class of DRC error
 * into one issue while the full message is still preserved on each event for
 * debugging.
 *
 * The value is namespaced so it never collides with fingerprints computed for
 * unrelated (non circuit-JSON) exceptions.
 */
export const getCircuitJsonErrorFingerprint = (error: {
  type?: string | null
}): string => {
  const errorType =
    typeof error?.type === "string" && error.type.length > 0
      ? error.type
      : "unknown"
  return `circuit-json-error:${errorType}`
}
