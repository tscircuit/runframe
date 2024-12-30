import { createCircuitWebWorker } from "@tscircuit/eval-webworker"
import { CircuitJsonPreview } from "./CircuitJsonPreview"
import { useEffect, useRef, useState } from "react"
import Debug from "debug"

const debug = Debug("run-frame:RunFrame")

declare global {
  var runFrameWorker: any
}

// @ts-ignore
import evalWebWorkerBlobUrl from "@tscircuit/eval-webworker/blob-url"
import type { ManualEditEvent } from "@tscircuit/props"
import { useRunFrameStore } from "./RunFrameWithApi/store"
import { getChangesBetweenFsMaps } from "../utils/getChangesBetweenFsMaps"

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
      // setError(null)
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
    }
    runWorker()
  }, [props.fsMap, props.entrypoint])

  return (
    <CircuitJsonPreview
      defaultActiveTab="schematic"
      leftHeaderContent={props.leftHeaderContent}
      circuitJson={circuitJson}
      errorMessage={error?.error}
      onEditEvent={props.onEditEvent}
      editEvents={props.editEvents}
    />
  )
}
