import { createCircuitWebWorker } from "@tscircuit/eval-webworker"
import { CircuitJsonPreview } from "./CircuitJsonPreview"
import { useEffect, useState } from "react"

// @ts-ignore
import evalWebWorkerBlobUrl from "@tscircuit/eval-webworker/blob-url"

interface Props {
  /**
   * Map of filenames to file contents that will be available in the worker
   */
  fsMap: { [filename: string]: string }

  /**
   * The entry point file that will be executed first
   */
  entrypoint: string

  /**
   * Called when the circuit JSON changes
   */
  onCircuitJsonChange?: (circuitJson: any) => void

  /**
   * Called when rendering is finished
   */
  onRenderingFinished?: (params: { circuitJson: any }) => void

  /**
   * Called for each render event
   */
  onRenderEvent?: (event: any) => void

  /**
   * Called when an error occurs
   */
  onError?: (error: Error) => void
}

export const RunFrame = (props: Props) => {
  const [circuitJson, setCircuitJson] = useState<any>(null)

  useEffect(() => {
    async function runWorker() {
      const worker = await createCircuitWebWorker({
        webWorkerUrl: evalWebWorkerBlobUrl,
        verbose: true,
      })
      const $finished = worker.executeWithFsMap({
        entrypoint: props.entrypoint,
        fsMap: props.fsMap,
      })
      console.log("waiting for execution to finish...")
      await $finished
      console.log("waiting for initial circuit json...")
      setCircuitJson(await worker.getCircuitJson())
      console.log("got initial circuit json")
      await $finished.catch((e) => {
        console.error(e)
      })
      setCircuitJson(await worker.getCircuitJson())
    }
    runWorker()
  }, [props.fsMap])

  console.log({ circuitJson })
  return <CircuitJsonPreview circuitJson={circuitJson} />
}