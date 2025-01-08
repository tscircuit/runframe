import { createCircuitWebWorker } from "@tscircuit/eval-webworker"
import { CircuitJsonPreview, type TabId } from "./CircuitJsonPreview"
import { useEffect, useRef, useState } from "react"
import Debug from "debug"

// TODO waiting for core PR: https://github.com/tscircuit/core/pull/489
// import { orderedRenderPhases } from "@tscircuit/core"

const numRenderPhases = 26

const debug = Debug("run-frame:RunFrame")

declare global {
  var runFrameWorker: any
}

// @ts-ignore
import evalWebWorkerBlobUrl from "@tscircuit/eval-webworker/blob-url"
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
    if (lastFsMapRef.current && circuitJson) {
      const changes = getChangesBetweenFsMaps(lastFsMapRef.current, fsMap)

      if (Object.keys(changes).length > 0) {
        debug("render triggered by changes:", changes)
      } else if (lastEntrypointRef.current !== props.entrypoint) {
        debug("render triggered by entrypoint change")
      } else {
        debug("render triggered without changes to fsMap, skipping")
        return
      }
    }

    lastFsMapRef.current = fsMap
    lastEntrypointRef.current = props.entrypoint

    async function runWorker() {
      debug("running render worker")
      setError(null)
      const renderLog: RenderLog = {}
      const worker: Awaited<ReturnType<typeof createCircuitWebWorker>> =
        globalThis.runFrameWorker ??
        (await createCircuitWebWorker({
          webWorkerUrl: evalWebWorkerBlobUrl,
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
          : 0

        if (activeTab === "render_log") {
          renderLog.renderEvents = renderLog.renderEvents ?? []
          event.createdAt = Date.now()
          renderLog.renderEvents.push(event)
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
          const message = e.message.split(":")[1]
          props.onError?.(e)
          setError({ error: message, stack: e.stack })
          console.error(e)
          return { success: false }
        })
      if (!evalResult.success) return

      const $renderResult = worker.renderUntilSettled()

      debug("waiting for initial circuit json...")
      let circuitJson = await worker.getCircuitJson().catch((e: any) => {
        debug("error getting initial circuit json", e)
        props.onError?.(e)
        setError({ error: e.message, stack: e.stack })
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
    }
    runWorker()
  }, [props.fsMap, props.entrypoint])

  return (
    <CircuitJsonPreview
      defaultActiveTab={props.defaultActiveTab}
      leftHeaderContent={props.leftHeaderContent}
      onActiveTabChange={setActiveTab}
      circuitJson={circuitJson}
      renderLog={renderLog}
      errorMessage={error?.error}
      onEditEvent={props.onEditEvent}
      editEvents={props.editEvents}
    />
  )
}
