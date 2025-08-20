import { createCircuitWebWorker as baseCreateCircuitWebWorker } from "@tscircuit/eval/worker"
import type {
  WebWorkerConfiguration,
  CircuitWebWorker,
} from "@tscircuit/eval/worker"

/**
 * Creates a CircuitWebWorker and sets up a fetch proxy so that any fetch calls
 * inside the worker are forwarded to the parent thread.
 */
export const createCircuitWebWorker = async (
  configuration: Partial<WebWorkerConfiguration>,
): Promise<CircuitWebWorker> => {
  const OriginalWorker = globalThis.Worker
  let capturedWorker: Worker | null = null

  class CapturingWorker extends OriginalWorker {
    constructor(stringUrl: string | URL, options?: WorkerOptions) {
      super(stringUrl, options)
      capturedWorker = this
    }
  }
  // Temporarily override global Worker constructor to capture the instance
  ;(globalThis as any).Worker = CapturingWorker

  try {
    const worker = await baseCreateCircuitWebWorker(configuration)

    if (capturedWorker) {
      setupFetchProxy(capturedWorker)
      // Expose raw worker for testing or advanced usage
      ;(worker as any).__rawWorker = capturedWorker
    } else {
      console.warn("Failed to capture worker instance for fetch proxy")
    }

    return worker
  } finally {
    // Restore original Worker constructor
    ;(globalThis as any).Worker = OriginalWorker
  }
}

function setupFetchProxy(worker: Worker) {
  worker.addEventListener("message", async (event: MessageEvent) => {
    const data = event.data as any
    if (!data || data.type !== "worker-fetch") return
    const { requestId, url, init } = data
    try {
      const response = await fetch(url, init)
      const body = await response.arrayBuffer()
      worker.postMessage(
        {
          type: "worker-fetch-result",
          requestId,
          ok: true,
          status: response.status,
          headers: [...response.headers.entries()],
          body,
        },
        [body],
      )
    } catch (err: any) {
      worker.postMessage({
        type: "worker-fetch-result",
        requestId,
        ok: false,
        error: { name: err.name, message: err.message },
      })
    }
  })

  worker.postMessage({ type: "override-global-fetch" })
}

export type { CircuitWebWorker, WebWorkerConfiguration }
