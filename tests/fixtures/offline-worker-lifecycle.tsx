// Run in a subprocess: Bun's module mocks otherwise leak into other worker tests.
import assert from "node:assert/strict"
import { mock } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { createBundledModuleProvider } from "../../lib/runtime/bundled-module-provider"
import type { RunFrameRuntime } from "../../lib/runtime/types"

const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" })
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  location: dom.window.location,
  IS_REACT_ACT_ENVIRONMENT: true,
})
let fetches = 0
globalThis.fetch = Object.assign(
  async () => {
    fetches++
    throw new Error("Unexpected public request")
  },
  { preconnect: fetch.preconnect },
)

const workers: Array<{ executions: number; kills: number }> = []
const configurations: any[] = []
mock.module("@tscircuit/eval/worker", () => ({
  createCircuitWebWorker: async (config: any) => {
    configurations.push(config)
    const state = { executions: 0, kills: 0 }
    workers.push(state)
    return {
      clearEventListeners: async () => {},
      on: () => {},
      executeWithFsMap: async () => {
        state.executions++
      },
      renderUntilSettled: async () => {},
      getCircuitJson: async () => [
        { type: "pcb_board", pcb_board_id: "board1" },
      ],
      kill: async () => {
        state.kills++
      },
    }
  },
}))
mock.module("lib/components/CircuitJsonPreview/CircuitJsonPreview", () => ({
  CircuitJsonPreview: (props: any) => <div>{props.errorMessage}</div>,
}))
const { RunFrame } = await import("../../lib/components/RunFrame/RunFrame")
const modules = createBundledModuleProvider({})
const runtime = (evalVersion: string, workerUrl?: string): RunFrameRuntime => ({
  mode: "offline",
  modules,
  fetch: globalThis.fetch,
  evalVersion,
  workerUrl,
})
const files = { "index.circuit.tsx": "export default () => <board />" }
const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
}
let root = createRoot(document.getElementById("root")!)

await act(async () => {
  root.render(
    <RunFrame runtime={runtime("1.0.0", "/worker1.js")} fsMap={files} />,
  )
  await flush()
})
assert.equal(workers.length, 1, "Preload and execution must share one worker")
assert.equal(workers[0]!.executions, 1)
assert.equal(configurations[0].evalVersion, "1.0.0")
assert.equal(configurations[0].disableCdnLoading, true)
assert.equal(configurations[0].webWorkerBlobUrl, "http://localhost/worker1.js")

await act(async () => {
  root.render(
    <RunFrame runtime={runtime("2.0.0", "/worker2.js")} fsMap={files} />,
  )
  await flush()
})
assert.equal(workers.length, 2)
assert.equal(workers[0]!.kills, 1)
assert.equal(
  workers[1]!.executions,
  1,
  "A replacement worker executes unchanged files",
)
await act(async () => {
  root.unmount()
  await flush()
})
assert.equal(workers[1]!.kills, 1)

root = createRoot(document.getElementById("root")!)
await act(async () => {
  root.render(<RunFrame runtime={runtime("1.0.0")} fsMap={files} />)
  await flush()
})
assert.equal(
  workers.length,
  2,
  "A missing local worker cannot trigger CDN bootstrap",
)
assert(document.body.textContent?.includes("No evaluator will be downloaded"))
await act(async () => {
  root.unmount()
  await flush()
})

root = createRoot(document.getElementById("root")!)
await act(async () => {
  root.render(
    <RunFrame
      runtime={runtime("1.0.0")}
      mainComponentPath="board.circuit.json"
      fsMap={{ "board.circuit.json": "[]" }}
    />,
  )
  await flush()
})
assert.equal(workers.length, 2, "Static Circuit JSON does not need a worker")
assert.equal(fetches, 0)
await act(async () => {
  root.unmount()
  await flush()
})
dom.window.close()
console.log("Offline worker lifecycle checks passed")
