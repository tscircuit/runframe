import { createCircuitWebWorker } from "@tscircuit/eval-webworker"
import { CircuitJsonPreview, type TabId } from "./CircuitJsonPreview"
import { useEffect, useMemo, useReducer, useRef, useState } from "react"
import Debug from "debug"
import { Loader2, Play } from "lucide-react"

// TODO waiting for core PR: https://github.com/tscircuit/core/pull/489
// import { orderedRenderPhases } from "@tscircuit/core"

const numRenderPhases = 26

const debug = Debug("run-frame:RunFrame")

declare global {
  var runFrameWorker: any
}

import type { ManualEditEvent } from "@tscircuit/props"
import { useRunFrameStore } from "./RunFrameWithApi/store"
import { getChangesBetweenFsMaps } from "../utils/getChangesBetweenFsMaps"
import type { RenderLog } from "lib/render-logging/RenderLog"
import { getPhaseTimingsFromRenderEvents } from "lib/render-logging/getPhaseTimingsFromRenderEvents"

interface Props {
  /**
   * Map of filenames to file contents that will be available in the worker
   */
  fsMap: Map<string, string> | Record<string, string>

  /**
   * The entry point file that will be executed first
   */
  entrypoint: string

  /**
   * Whether to show a run button that controls when code executes
   */
  showRunButton?: boolean

  /**
   * An optional left-side header, you can put a save button, a run button, or
   * a title here.
   */
  leftHeaderContent?: React.ReactNode

  /**
   * Called when the circuit JSON changes
   */
  onCircuitJsonChange?: (circuitJson: any) => void

  /**
   * Called when rendering is finished
   */
  onRenderFinished?: (params: { circuitJson: any }) => void

  /**
   * Called when the initial render is finished (fast)
   */
  onInitialRender?: (params: { circuitJson: any }) => void

  /**
   * Called when rendering is started
   */
  onRenderStarted?: () => void

  /**
   * Called for each render event
   */
  onRenderEvent?: (event: any) => void

  /**
   * Called when an error occurs
   */
  onError?: (error: Error) => void

  /**
   * Called when an edit event occurs
   */
  onEditEvent?: (editEvent: ManualEditEvent) => void

  /**
   * Any edit events that have occurred and should be applied
   */
  editEvents?: ManualEditEvent[]

  /**
   * If true, turns on debug logging
   */
  debug?: boolean

  defaultActiveTab?: Parameters<
    typeof CircuitJsonPreview
  >[0]["defaultActiveTab"]

  evalWebWorkerBlobUrl?: string
}

export const RunFrame = (props: Props) => {
  const [circuitJson, setCircuitJson] = useRunFrameStore((s) => [
    s.circuitJson,
    s.setCircuitJson,
  ])
  const [error, setError] = useState<{
    phase?: string
    componentDisplayName?: string
    error?: string
    stack?: string
  } | null>(null)
  const [runCountTrigger, incRunCountTrigger] = useReducer(
    (acc: number, s: number) => acc + 1,
    0,
  )
  const lastRunCountTriggerRef = useRef(0)
  const [isRunning, setIsRunning] = useState(false)
  const [renderLog, setRenderLog] = useState<RenderLog | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>(
    props.defaultActiveTab ?? "pcb",
  )
  useEffect(() => {
    if (props.debug) Debug.enable("run-frame*")
  }, [props.debug])

  const fsMap =
    props.fsMap instanceof Map
      ? props.fsMap
      : Object.entries(props.fsMap ?? {}).reduce(
          (m, [k, v]) => m.set(k, v),
          new Map(),
        )
  const lastFsMapRef = useRef<Map<string, string> | null>(null)
  const lastEntrypointRef = useRef<string | null>(null)

  useEffect(() => {
    if (!fsMap) return
    const wasTriggeredByRunButton =
      props.showRunButton && runCountTrigger !== lastRunCountTriggerRef.current
    if (lastFsMapRef.current && circuitJson) {
      const changes = getChangesBetweenFsMaps(lastFsMapRef.current, fsMap)

      if (Object.keys(changes).length > 0) {
        debug("code changes detected")
      } else if (lastEntrypointRef.current !== props.entrypoint) {
        debug("render triggered by entrypoint change")
      } else if (!wasTriggeredByRunButton) {
        debug("render triggered without changes to fsMap, skipping")
        return
      }
    }

    if (
      props.showRunButton &&
      runCountTrigger === lastRunCountTriggerRef.current
    ) {
      return
    }

    lastFsMapRef.current = fsMap
    lastEntrypointRef.current = props.entrypoint
    lastRunCountTriggerRef.current = runCountTrigger
    setIsRunning(true)

    async function runWorker() {
      debug("running render worker")
      setError(null)
      const renderLog: RenderLog = { progress: 0 }
      const worker: Awaited<ReturnType<typeof createCircuitWebWorker>> =
        globalThis.runFrameWorker ??
        (await createCircuitWebWorker({
          webWorkerUrl: props.evalWebWorkerBlobUrl,
          verbose: true,
        }))
      globalThis.runFrameWorker = worker
      props.onRenderStarted?.()

      const fsMapObj =
        fsMap instanceof Map ? Object.fromEntries(fsMap.entries()) : fsMap

      if (!fsMapObj[props.entrypoint]) {
        setError({
          error: `Entrypoint not found (entrypoint: "${props.entrypoint}", fsMapKeys: ${Object.keys(fsMapObj).join(", ")})`,
          stack: "",
        })
        return
      }

      const renderIds = new Set<string>()
      const startRenderTime = Date.now()
      let lastRenderLogSet = Date.now()
      worker.on("renderable:renderLifecycle:anyEvent", (event: any) => {
        renderLog.lastRenderEvent = event
        renderLog.eventsProcessed = (renderLog.eventsProcessed ?? 0) + 1
        if (!renderIds.has(event.renderId)) {
          renderIds.add(event.renderId)
        }
        const estTotalRenderEvents = renderIds.size * numRenderPhases * 2
        const hasProcessedEnoughToEstimateProgress =
          renderLog.eventsProcessed > renderIds.size * 2

        // This estimated progress goes over 100% because of repeated render
        // events, so we use a exponential decay to make it appear [0, 100%]
        const estProgressLinear =
          renderLog.eventsProcessed / estTotalRenderEvents

        const estProgress = 1 - Math.exp(-estProgressLinear * 3)

        renderLog.progress = hasProcessedEnoughToEstimateProgress
          ? estProgress
          : // Until we have enough events to estimate progress, we use the 0-5%
            // range and assume that there are ~500 renderIds, this will usually
            // be an underestimate.
            (1 - Math.exp(-(renderLog.eventsProcessed ?? 0) / 1000)) * 0.05

        if (activeTab === "render_log") {
          renderLog.renderEvents = renderLog.renderEvents ?? []
          event.createdAt = Date.now()
          renderLog.renderEvents.push(event)
          if (Date.now() - lastRenderLogSet > 500) {
            renderLog.phaseTimings = getPhaseTimingsFromRenderEvents(
              renderLog.renderEvents ?? [],
            )
            lastRenderLogSet = Date.now()
          }
        }
        setRenderLog({ ...renderLog })
      })

      const evalResult = await worker
        .executeWithFsMap({
          entrypoint: props.entrypoint,
          fsMap: fsMapObj,
        })
        .then(() => ({ success: true }))
        .catch((e: any) => {
          // removing the prefix "Eval compiled js error for "./main.tsx":"
          const message: string = e.message.includes(":")
            ? e.message.replace(/[^:]+:/, "")
            : e.message
          props.onError?.(e)
          setError({ error: message, stack: e.stack })
          console.error(e)
          return { success: false }
        })
      if (!evalResult.success) return setIsRunning(false)

      const $renderResult = worker.renderUntilSettled()

      debug("waiting for initial circuit json...")
      let circuitJson = await worker.getCircuitJson().catch((e: any) => {
        debug("error getting initial circuit json", e)
        props.onError?.(e)
        setError({ error: e.message, stack: e.stack })
        setIsRunning(false)
        return null
      })
      if (!circuitJson) return
      debug("got initial circuit json")
      setCircuitJson(circuitJson)
      props.onCircuitJsonChange?.(circuitJson)
      props.onInitialRender?.({ circuitJson })

      await $renderResult

      debug("getting final circuit json")
      circuitJson = await worker.getCircuitJson()
      props.onCircuitJsonChange?.(circuitJson)
      setCircuitJson(circuitJson)
      props.onRenderFinished?.({ circuitJson })

      if (activeTab === "render_log") {
        renderLog.phaseTimings = getPhaseTimingsFromRenderEvents(
          renderLog.renderEvents ?? [],
        )
      }
      renderLog.progress = 1

      setRenderLog({ ...renderLog })
      setIsRunning(false)
    }
    runWorker()
  }, [props.fsMap, props.entrypoint, runCountTrigger])

  const circuitJsonKey = useMemo(() => {
    return `cj-${Math.random().toString(36).substring(2, 15)}`
  }, [circuitJson])

  return (
    <CircuitJsonPreview
      defaultActiveTab={props.defaultActiveTab}
      leftHeaderContent={
        <>
          {props.showRunButton && (
            <button
              type="button"
              onClick={() => {
                incRunCountTrigger(1)
              }}
              className="rf-flex rf-items-center rf-gap-2 rf-px-4 rf-py-2 rf-bg-blue-600 rf-text-white rf-rounded-md rf-mr-2 disabled:rf-opacity-50"
              disabled={isRunning}
            >
              Run{" "}
              {isRunning ? (
                <Loader2 className="rf-w-3 rf-h-3 rf-animate-spin" />
              ) : (
                <Play className="rf-w-3 rf-h-3" />
              )}
            </button>
          )}
          {props.leftHeaderContent}
        </>
      }
      onActiveTabChange={setActiveTab}
      circuitJson={circuitJson}
      circuitJsonKey={circuitJsonKey}
      renderLog={renderLog}
      isRunningCode={isRunning}
      errorMessage={error?.error}
      onEditEvent={props.onEditEvent}
      editEvents={props.editEvents}
    />
  )
}
