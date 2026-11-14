import type { RunFrameNestedEvent } from "../RunFrameWithIframe/RunFrameIframeEvent"
import { getCircuitJsonElementCounts } from "../RunFrameWithIframe/get-circuit-json-element-counts"
import type { RunFrameProps } from "./RunFrameProps"

/**
 * RunFrame's callbacks as events. The iframe posts them to its parent, and
 * a controller receives them, so both hear the same things.
 */
export const getRunFrameEventCallbacks = (
  emit: (event: RunFrameNestedEvent) => void,
) =>
  ({
    onError: (error) => {
      emit({
        type: "error",
        error_message: error.message ?? error.toString(),
      })
    },
    onRenderStarted: () => emit({ type: "render_started" }),
    onCircuitJsonChange: (circuitJson) => {
      emit({
        type: "circuit_json_changed",
        circuit_json_element_counts: getCircuitJsonElementCounts(circuitJson),
      })
    },
    onRenderFinished: ({ circuitJson }) => {
      emit({
        type: "render_finished",
        circuit_json_element_counts: getCircuitJsonElementCounts(circuitJson),
      })
    },
    onRunCompleted: (payload) => {
      emit({
        type: "run_completed",
        has_execution_error: payload.hasExecutionError,
        error_count: payload.errors?.length ?? 0,
      })
    },
    onActiveTabChange: (tab) => emit({ type: "active_tab_changed", tab }),
  }) satisfies Partial<RunFrameProps>
