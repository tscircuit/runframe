import { useCallback, useMemo, useState } from "react"
import type { TabId } from "../CircuitJsonPreview/PreviewContentProps"
import type {
  CircuitJsonElementCounts,
  RunFrameNestedEvent,
} from "../RunFrameWithIframe/RunFrameIframeEvent"
import { getRunFrameEventCallbacks } from "./get-run-frame-event-callbacks"
import type { RunFrameProps } from "./RunFrameProps"

export interface RunFrameController {
  /** @internal The tab to show, or null while RunFrame picks its own. */
  activeTab: TabId | null
  /** @internal RunFrame reports its runs and the tabs it shows or asks for. */
  onEvent: (event: RunFrameNestedEvent) => void
}

/**
 * Lets a host drive RunFrame and follow what it does, for a host that draws
 * its own header: pass `controller` to RunFrame or RunFrameWithIframe, usually
 * with `showHeader={false}`.
 *
 * `setActiveTab` may be called before RunFrame mounts. When RunFrame asks for
 * a tab itself, such as the errors tab after a failed run, `activeTab` follows.
 */
export const useRunFrameController = () => {
  const [activeTab, setActiveTab] = useState<TabId | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [circuitJsonElementCounts, setCircuitJsonElementCounts] =
    useState<CircuitJsonElementCounts | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onEvent = useCallback((event: RunFrameNestedEvent) => {
    switch (event.type) {
      case "render_started":
        setIsRunning(true)
        break
      case "circuit_json_changed":
      case "render_finished":
        setCircuitJsonElementCounts(event.circuit_json_element_counts)
        setErrorMessage(null)
        break
      case "run_completed":
        setIsRunning(false)
        if (!event.has_execution_error) setErrorMessage(null)
        break
      case "error":
        setCircuitJsonElementCounts(null)
        setErrorMessage(event.error_message)
        break
      case "active_tab_changed":
        setActiveTab(event.tab)
        break
    }
  }, [])

  const controller = useMemo<RunFrameController>(
    () => ({ activeTab, onEvent }),
    [activeTab, onEvent],
  )

  return {
    controller,
    /** The tab on screen, or null until one is picked or reported. */
    activeTab,
    setActiveTab,
    /** True from the start of a run until it ends, rendered or thrown. */
    isRunning,
    /**
     * How many elements of each type the last render has, such as
     * `{ pcb_board: 1 }`. Null before the first render and after a run threw.
     */
    circuitJsonElementCounts,
    /** The message of a run that threw, until a later run renders. */
    errorMessage,
  }
}

/** Applies a controller to RunFrame's props: its tab wins, and it hears every event. */
export const connectRunFrameController = (
  props: RunFrameProps,
): RunFrameProps => {
  const { controller } = props
  if (!controller) return props
  const events = getRunFrameEventCallbacks(controller.onEvent)
  return {
    ...props,
    activeTab: controller.activeTab ?? props.activeTab,
    onError: (error) => {
      events.onError(error)
      props.onError?.(error)
    },
    onRenderStarted: () => {
      events.onRenderStarted()
      props.onRenderStarted?.()
    },
    onCircuitJsonChange: (circuitJson) => {
      events.onCircuitJsonChange(circuitJson)
      props.onCircuitJsonChange?.(circuitJson)
    },
    onRenderFinished: (params) => {
      events.onRenderFinished(params)
      props.onRenderFinished?.(params)
    },
    onRunCompleted: (payload) => {
      events.onRunCompleted(payload)
      props.onRunCompleted?.(payload)
    },
    onActiveTabChange: (tab) => {
      events.onActiveTabChange(tab)
      props.onActiveTabChange?.(tab)
    },
  }
}
