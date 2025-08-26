import { createCircuitWebWorker } from "@tscircuit/eval/worker"
import Debug from "debug"
import { Loader2, Play, Square } from "lucide-react"
import { useEffect, useReducer, useRef, useState } from "react"
import {
  CircuitJsonPreview,
  type TabId,
} from "../CircuitJsonPreview/CircuitJsonPreview"
import { Button } from "../ui/button"

// TODO waiting for core PR: https://github.com/tscircuit/core/pull/489
// import { orderedRenderPhases } from "@tscircuit/core"

const numRenderPhases = 26

const debug = Debug("run-frame:RunFrame")

declare global {
  var runFrameWorker: any
}

import {
  orderedRenderPhases,
  type AutoroutingStartEvent,
} from "@tscircuit/core"
import type { RenderLog } from "lib/render-logging/RenderLog"
import { getPhaseTimingsFromRenderEvents } from "lib/render-logging/getPhaseTimingsFromRenderEvents"
import { getChangesBetweenFsMaps } from "../../utils/getChangesBetweenFsMaps"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import type { RunFrameProps } from "./RunFrameProps"
import { useRunnerStore } from "./runner-store/use-runner-store"
import { useMutex } from "./useMutex"
import type { ManualEditEvent } from "@tscircuit/props"
import { registryKy } from "../../utils/get-registry-ky"
import { FileMenuLeftHeader } from "../FileMenuLeftHeader"
import { useStyles } from "../../hooks/use-styles"

const fetchLatestEvalVersion = async () => {
  try {
    const response = await fetch(
      "https://data.jsdelivr.com/v1/package/npm/@tscircuit/eval",
    )
    if (response.ok) {
      const data = await response.json()
      return data.tags?.latest as string | undefined
    }
  } catch (err) {
    console.error("Failed to fetch latest eval version", err)
  }
  return undefined
}

const resolveEvalVersion = async (
  evalVersionProp?: string,
  forceLatest?: boolean,
) => {
  if (evalVersionProp) return evalVersionProp

  if (forceLatest || !window.TSCIRCUIT_LATEST_EVAL_VERSION) {
    const latest = await fetchLatestEvalVersion()
    if (latest) {
      window.TSCIRCUIT_LATEST_EVAL_VERSION = latest
      return latest
    }
  }

  if (window.TSCIRCUIT_LATEST_EVAL_VERSION) {
    return window.TSCIRCUIT_LATEST_EVAL_VERSION
  }

  return "latest"
}

export type { RunFrameProps }

export const RunFrame = (props: RunFrameProps) => {
  useStyles()

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
  const cancelExecutionRef = useRef<(() => void) | null>(null)
  const [autoroutingGraphics, setAutoroutingGraphics] = useState<any>(null)
  const [runCountTrigger, incRunCountTrigger] = useReducer(
    (acc: number, s: number) => acc + 1,
    0,
  )
  const setLastRunEvalVersion = useRunnerStore((s) => s.setLastRunEvalVersion)
  const lastRunCountTriggerRef = useRef(0)
  const runMutex = useMutex()
  const [isRunning, setIsRunning] = useState(false)
  const [dependenciesLoaded, setDependenciesLoaded] = useState(false)
  const [activeAsyncEffects, setActiveAsyncEffects] = useState<
    Record<
      string,
      {
        effectName: string
        phase: string
        componentDisplayName?: string
        startTime: number
      }
    >
  >({})

  const activeEffectName = Object.values(activeAsyncEffects).sort(
    (a, b) => a.startTime - b.startTime,
  )[0]?.effectName

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !isRunning) {
        incRunCountTrigger(1)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isRunning])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        if (!globalThis.runFrameWorker) {
          const evalVersion = await resolveEvalVersion(
            props.evalVersion,
            props.forceLatestEvalVersion,
          )

          const worker = await createCircuitWebWorker({
            evalVersion,
            webWorkerBlobUrl: props.evalWebWorkerBlobUrl,
            verbose: true,
            ...(props.enableFetchProxy && {
              enableFetchProxy: props.enableFetchProxy,
            }),
          })
          if (cancelled) return
          globalThis.runFrameWorker = worker
          setLastRunEvalVersion(evalVersion)
        }
        if (!cancelled) setDependenciesLoaded(true)
      } catch (err) {
        console.error("Failed to preload eval worker", err)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [
    props.evalVersion,
    props.evalWebWorkerBlobUrl,
    props.forceLatestEvalVersion,
  ])

  const [renderLog, setRenderLog] = useState<RenderLog | null>(null)
  const [autoroutingLog, setAutoroutingLog] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState<TabId>(
    props.defaultActiveTab ?? props.defaultTab ?? "pcb",
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
    if (props.isLoadingFiles) return
    // Convert fsMap to object for consistent handling
    const fsMapObj =
      fsMap instanceof Map ? Object.fromEntries(fsMap.entries()) : fsMap

    // Check if no files are provided
    if (!fsMapObj || Object.keys(fsMapObj).length === 0) {
      setError({
        error:
          "No files provided. Please provide at least one file with code to execute.",
        stack: "",
      })
      setIsRunning(false)
      return
    }

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
    lastEntrypointRef.current = props.entrypoint ?? null
    lastRunCountTriggerRef.current = runCountTrigger
    setIsRunning(true)

    const runWorker = async () => {
      debug("running render worker")
      setError(null)
      setRenderLog(null)
      setActiveAsyncEffects({})
      const renderLog: RenderLog = { progress: 0 }
      let cancelled = false

      // Store cleanup function in ref to be called when execution is stopped
      cancelExecutionRef.current = () => {
        cancelled = true
      }

      const resolvedEvalVersion = await resolveEvalVersion(
        props.evalVersion,
        !globalThis.runFrameWorker && props.forceLatestEvalVersion,
      )
      debug("resolvedEvalVersion", resolvedEvalVersion)

      const worker: Awaited<ReturnType<typeof createCircuitWebWorker>> =
        globalThis.runFrameWorker ??
        (await createCircuitWebWorker({
          evalVersion: resolvedEvalVersion,
          webWorkerBlobUrl: props.evalWebWorkerBlobUrl,
          verbose: true,
          ...(props.enableFetchProxy && {
            enableFetchProxy: props.enableFetchProxy,
          }),
        }))
      globalThis.runFrameWorker = worker
      setLastRunEvalVersion(resolvedEvalVersion)
      debug("Starting render...")
      props.onRenderStarted?.()

      const fsMapObj =
        fsMap instanceof Map ? Object.fromEntries(fsMap.entries()) : fsMap

      let lastRenderLogSet = Date.now()
      worker.on("asyncEffect:start", (event: any) => {
        const id = `${event.phase}|${event.componentDisplayName ?? ""}|${event.effectName}`
        setActiveAsyncEffects((effects) => ({
          ...effects,
          [id]: { ...event, startTime: Date.now() },
        }))
      })
      worker.on("asyncEffect:end", (event: any) => {
        const id = `${event.phase}|${event.componentDisplayName ?? ""}|${event.effectName}`
        setActiveAsyncEffects((effects) => {
          const { [id]: _removed, ...rest } = effects
          return rest
        })
      })
      worker.on("autorouting:start", (event: AutoroutingStartEvent) => {
        setAutoroutingLog({
          ...autoroutingLog,
          [event.componentDisplayName]: {
            simpleRouteJson: event.simpleRouteJson,
          },
        })
      })
      worker.on("board:renderPhaseStarted", (event: any) => {
        renderLog.lastRenderEvent = event
        renderLog.eventsProcessed = (renderLog.eventsProcessed ?? 0) + 1
        const hasProcessedEnoughToEstimateProgress =
          renderLog.eventsProcessed > 2

        const estProgressLinear =
          (orderedRenderPhases.indexOf(event.phase) / numRenderPhases) * 0.75 +
          (renderLog.eventsProcessed / 1000) * 0.25

        const estProgress = 1 - Math.exp(-estProgressLinear * 3)

        renderLog.progress = estProgress

        if (!cancelled) {
          setRenderLog({ ...renderLog })
        }
      })

      if (activeTab === "render_log") {
        worker.on("renderable:renderLifecycle:anyEvent", (event: any) => {
          renderLog.renderEvents = renderLog.renderEvents ?? []
          event.createdAt = Date.now()
          renderLog.renderEvents.push(event)
          if (Date.now() - lastRenderLogSet > 500) {
            renderLog.phaseTimings = getPhaseTimingsFromRenderEvents(
              renderLog.renderEvents ?? [],
            )
            lastRenderLogSet = Date.now()
          }
          if (!cancelled) {
            setRenderLog({ ...renderLog })
          }
        })
      }

      worker.on("autorouting:progress", (event: any) => {
        setAutoroutingGraphics(event.debugGraphics)
      })

      debug("Executing fsMap...")
      const evalResult = await worker
        .executeWithFsMap({
          entrypoint: props.entrypoint,
          fsMap: fsMapObj,
          ...(props.mainComponentPath
            ? { mainComponentPath: props.mainComponentPath }
            : {}),
        })
        .then(() => {
          return { success: true }
        })
        .catch((e: any) => {
          // removing the prefix "Eval compiled js error for "./main.tsx":"
          const message: string = e.message.replace("Error: ", "")
          debug(`eval error: ${message}`)
          props.onError?.(e)
          setError({ error: message, stack: e.stack })
          setRenderLog(null)
          console.error(e)
          return { success: false }
        })
      debug("worker call started")
      if (!evalResult.success) {
        setIsRunning(false)
        setActiveAsyncEffects({})
        return
      }

      const $renderResult = worker.renderUntilSettled()

      debug("waiting for initial circuit json...")
      let circuitJson = await worker.getCircuitJson().catch((e: any) => {
        debug("error getting initial circuit json", e)
        props.onError?.(e)
        setError({ error: e.message, stack: e.stack })
        setRenderLog(null)
        setIsRunning(false)
        setActiveAsyncEffects({})
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
      setAutoroutingGraphics({})

      if (activeTab === "render_log") {
        renderLog.phaseTimings = getPhaseTimingsFromRenderEvents(
          renderLog.renderEvents ?? [],
        )
      }
      renderLog.progress = 1

      if (!cancelled) {
        setRenderLog({ ...renderLog })
      }
      setIsRunning(false)
      setActiveAsyncEffects({})
      cancelExecutionRef.current = null
    }
    runMutex.runWithMutex(runWorker)
  }, [
    props.fsMap,
    props.entrypoint,
    runCountTrigger,
    props.evalVersion,
    props.mainComponentPath,
    props.isLoadingFiles,
  ])

  // Updated to debounce edit events so only the last event is emitted after dragging ends
  const lastEditEventRef = useRef<any>(null)
  const dragTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleEditEvent = (event: ManualEditEvent) => {
    if (!event || event === null) {
      console.warn(
        "[RunFrame] handleEditEvent received null or undefined event.",
      )
      return
    }
    if (event.in_progress) {
      lastEditEventRef.current = event
      if (dragTimeout.current) {
        clearTimeout(dragTimeout.current)
        dragTimeout.current = null
      }
    } else {
      if (dragTimeout.current) {
        clearTimeout(dragTimeout.current)
      }
      dragTimeout.current = setTimeout(() => {
        // Use the current event if available, otherwise use the last in-progress event
        const eventToSend = event || lastEditEventRef.current
        props.onEditEvent?.(eventToSend)
        lastEditEventRef.current = null
        dragTimeout.current = null
      }, 100)
    }
  }

  const handleReportAutoroutingLog = async (
    name: string,
    data: { simpleRouteJson: any },
  ) => {
    let urlPath = ""
    const softwareMetadata =
      Array.isArray(circuitJson) &&
      (circuitJson as any[]).find(
        (el) => el.type === "software_project_metadata",
      )
    const projectUrl = props.projectUrl ?? softwareMetadata?.project_url
    if (projectUrl) {
      try {
        urlPath = new URL(projectUrl).pathname
      } catch {
        urlPath = projectUrl
      }
    }
    const title = urlPath ? `${urlPath} - ${name}` : name
    await registryKy
      .post("autorouting/bug_reports/create", {
        json: {
          title,
          simple_route_json: data.simpleRouteJson,
        },
      })
      .json<{ autorouting_bug_report: { autorouting_bug_report_id: string } }>()
      .then(({ autorouting_bug_report }) => {
        window.open(
          `https://api.tscircuit.com/autorouting/bug_reports/view?autorouting_bug_report_id=${autorouting_bug_report.autorouting_bug_report_id}`,
          "_blank",
        )
      })
      .catch((error) => {
        console.error("Failed to report autorouting bug", error)
        if (error.message.includes("401")) {
          alert("You must be logged in to report autorouting bugs")
        } else {
          alert(`Failed to report autorouting bug: ${error.message}`)
        }
      })
  }

  if (props.isLoadingFiles) {
    return (
      <div className="rf-flex rf-flex-col rf-w-full rf-h-full">
        <div className="rf-flex rf-items-center rf-gap-4 rf-p-2 rf-border-b">
          <div className="rf-w-20 rf-h-9 rf-bg-gray-200 dark:rf-bg-gray-700 rf-rounded-md rf-animate-pulse" />
          <div className="rf-flex rf-gap-6 rf-ml-auto">
            {["PCB", "Schematic", "3D"].map((_, i) => (
              <div
                key={i}
                className="rf-h-6 rf-w-20 rf-bg-gray-200 dark:rf-bg-gray-700 rf-rounded rf-animate-pulse"
              />
            ))}
          </div>
        </div>
        <div className="rf-flex-1 rf-p-4">
          <div className="rf-w-full rf-h-full rf-rounded-lg rf-bg-gray-100 dark:rf-bg-gray-800 rf-animate-pulse rf-flex rf-items-center rf-justify-center">
            <div className="rf-flex rf-flex-col rf-items-center rf-gap-4">
              <div className="rf-text-sm rf-text-gray-400 dark:rf-text-gray-500">
                Loading files...
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <CircuitJsonPreview
      code={fsMap.get(props.entrypoint ?? props.mainComponentPath)}
      fsMap={fsMap}
      defaultActiveTab={props.defaultActiveTab ?? props.defaultTab}
      defaultTab={props.defaultTab}
      availableTabs={props.availableTabs}
      showToggleFullScreen={props.showToggleFullScreen}
      autoroutingGraphics={autoroutingGraphics}
      autoroutingLog={autoroutingLog}
      onReportAutoroutingLog={
        props.onReportAutoroutingLog || handleReportAutoroutingLog
      }
      leftHeaderContent={
        <>
          {props.showRunButton && (
            <div className="rf-relative rf-inline-flex">
              <button
                type="button"
                onClick={() => {
                  incRunCountTrigger(1)
                }}
                className="rf-flex rf-items-center rf-gap-2 rf-px-4 rf-py-2 rf-bg-blue-600 hover:rf-bg-blue-700 rf-text-white rf-rounded-md disabled:rf-opacity-50 transition-colors duration-200"
                disabled={isRunning || !dependenciesLoaded}
              >
                Run{" "}
                {isRunning || !dependenciesLoaded ? (
                  <Loader2 className="rf-w-3 rf-h-3 rf-animate-spin" />
                ) : (
                  <Play className="rf-w-3 rf-h-3" />
                )}
              </button>
              {isRunning && (
                <div className="rf-flex rf-items-center rf-ml-1">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsRunning(false)
                      setRenderLog(null)
                      setError(null)
                      // Call cleanup to prevent race conditions
                      if (cancelExecutionRef.current) {
                        cancelExecutionRef.current()
                        cancelExecutionRef.current = null
                      }
                      // Cancel the mutex to allow next execution
                      runMutex.cancel()
                      setActiveAsyncEffects({})
                      // Kill the worker using the provided kill function
                      if (globalThis.runFrameWorker) {
                        globalThis.runFrameWorker.kill()
                        globalThis.runFrameWorker = null
                      }
                    }}
                    variant="ghost"
                    size="icon"
                    className="rf-text-red-300 hover:rf-text-red-400 hover:!rf-bg-transparent [&>svg]:rf-text-red-300 [&>svg]:hover:rf-text-red-400 rf-flex rf-items-center rf-justify-center"
                  >
                    <Square
                      className="!rf-h-2.5 !rf-w-2.5"
                      fill="currentColor"
                      stroke="currentColor"
                    />
                  </Button>
                </div>
              )}
            </div>
          )}
          {props.showFileMenu !== false && (
            <FileMenuLeftHeader isWebEmbedded={props.isWebEmbedded} />
          )}
          {props.leftHeaderContent}
        </>
      }
      onActiveTabChange={setActiveTab}
      circuitJson={circuitJson}
      renderLog={renderLog}
      activeEffectName={activeEffectName}
      isRunningCode={isRunning}
      errorMessage={error?.error}
      errorStack={error?.stack}
      onEditEvent={handleEditEvent}
      editEvents={props.editEvents}
      defaultToFullScreen={props.defaultToFullScreen}
    />
  )
}
