import { test, expect } from "bun:test"
import { createCircuitWebWorker } from "../lib/utils/createCircuitWebWorker"
import evalWebWorkerBlobUrl from "@tscircuit/eval/blob-url"

// Verify that worker-fetch messages are handled and forwarded to real fetch
// by the parent thread.
test("forwards worker fetch requests", async () => {
  const worker = await createCircuitWebWorker({
    webWorkerUrl: evalWebWorkerBlobUrl,
    verbose: true,
  })

  const rawWorker = (worker as any).__rawWorker as Worker

  const responsePromise = new Promise<any>((resolve) => {
    rawWorker.postMessage = (msg: any) => {
      resolve(msg)
    }
  })

  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url: string | URL, init?: any) => {
    return new Response("hello")
  }

  rawWorker.dispatchEvent(
    new MessageEvent("message", {
      data: {
        type: "worker-fetch",
        requestId: "1",
        url: "http://example.com/test",
        init: {},
      },
    }),
  )

  const response = await responsePromise
  expect(response.type).toBe("worker-fetch-result")
  expect(response.ok).toBe(true)
  const text = new TextDecoder().decode(response.body)
  expect(text).toBe("hello")

  globalThis.fetch = originalFetch
  await worker.kill()
})
