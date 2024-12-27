import { createCircuitWebWorker } from "@tscircuit/eval-webworker"
import { CircuitJsonPreview } from "./CircuitJsonPreview"
import { useEffect, useState } from "react"
import Debug from "debug"

const debug = Debug("run-frame")

declare global {
  var runFrameWorker: any
}

// @ts-ignore
import evalWebWorkerBlobUrl from "@tscircuit/eval-webworker/blob-url"
import type { ManualEditEvent } from "@tscircuit/props"
import { useRunFrameStore } from "./RunFrameWithApi/store"

interface Props {
  /**
   * Map of filenames to file contents that will be available in the worker
   */
  fsMap: Map<string, string> | { [filename: string]: string }

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

  useEffect(() => {
    async function runWorker() {
      const worker =
        globalThis.runFrameWorker ??
        (await createCircuitWebWorker({
          webWorkerUrl: evalWebWorkerBlobUrl,
          verbose: true,
        }))
      globalThis.runFrameWorker = worker
      props.onRenderStarted?.()

      const fsMapObj =
        props.fsMap instanceof Map
          ? Object.fromEntries(props.fsMap.entries())
          : props.fsMap

      const $finished = worker
        .executeWithFsMap({
          entrypoint: props.entrypoint,
          fsMap: fsMapObj,
        })
        .catch((e: any) => {
          // removing the prefix "Eval compiled js error for "./main.tsx":"
          const message = e.message.split(":")[1]
          setError({ error: message, stack: e.stack })
          console.error(e)
        })

      debug("waiting for initial circuit json...")
      let circuitJson = await worker.getCircuitJson()
      setCircuitJson(circuitJson)
      props.onCircuitJsonChange?.(circuitJson)
      props.onInitialRender?.({ circuitJson })

      debug("waiting for execution to finish...")
      await $finished

      debug("getting final circuit json")
      circuitJson = await worker.getCircuitJson()
      props.onCircuitJsonChange?.(circuitJson)
      setCircuitJson(circuitJson)
      props.onRenderFinished?.({ circuitJson })
    }
    runWorker()
  }, [props.fsMap])

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
