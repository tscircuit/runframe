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
  const [error, setError] = useState<{
    phase?: string
    componentDisplayName?: string
    error?: string
    stack?: string
  } | null>(null)

  useEffect(() => {
    let worker: Awaited<ReturnType<typeof createCircuitWebWorker>>

    async function runWorker() {
      try {
        worker = await createCircuitWebWorker({
          webWorkerUrl: evalWebWorkerBlobUrl,
          verbose: true,
        })

        // Set up error listener
        worker.on("eval_error", (errorData) => {
          setError(errorData)
          // Call the onError prop if provided
          if (props.onError) {
            props.onError(new Error(`${errorData.error} in ${errorData.componentDisplayName} during ${errorData.phase}`))
          }
        })

        const $finished = worker.executeWithFsMap({
          entrypoint: props.entrypoint,
          fsMap: props.fsMap,
        })

        console.log("waiting for execution to finish...")
        await $finished
        console.log("waiting for initial circuit json...")
        
        const json = await worker.getCircuitJson()
        setCircuitJson(json)
        props.onCircuitJsonChange?.(json)
        
        console.log("got initial circuit json")
        
        await worker.renderUntilSettled()
        const finalJson = await worker.getCircuitJson()
        setCircuitJson(finalJson)
        props.onCircuitJsonChange?.(finalJson)
        props.onRenderingFinished?.({ circuitJson: finalJson })

      } catch (e: any) {
        console.error(e)
        setError({ error: e.message, stack: e.stack })
        props.onError?.(e)
      }
    }
    runWorker()
  }, [props.fsMap])

  console.log({ circuitJson })
  return <CircuitJsonPreview circuitJson={circuitJson} errorMessage={error?.error} />
}
