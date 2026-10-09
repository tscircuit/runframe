import { expect, mock, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act, cloneElement } from "react"
import { createRoot } from "react-dom/client"

const executeWithFsMap = mock(async (_options: unknown) => {})
const clearEventListeners = mock(async () => {})
const worker = {
  executeWithFsMap,
  clearEventListeners,
  on: mock(() => {}),
  renderUntilSettled: mock(async () => {}),
  getCircuitJson: mock(async () => []),
  kill: mock(async () => {}),
}
const createWorker = mock(async (_options: unknown) => {
  await new Promise((resolve) => setTimeout(resolve, 20))
  return { ...worker }
})
mock.module("@tscircuit/eval/worker", () => ({
  createCircuitWebWorker: createWorker,
}))
mock.module("posthog-js", () => ({
  default: {
    init: () => {},
    capture: () => {},
    identify: () => {},
    captureException: () => {},
  },
}))
mock.module("lib/components/CircuitJsonPreview/CircuitJsonPreview", () => ({
  CircuitJsonPreview: ({ circuitJson, errorMessage, isRunningCode }: any) => (
    <div data-running={String(isRunningCode)}>
      <output>{errorMessage ?? "No errors or warnings"}</output>
      <pre data-circuit-json>{JSON.stringify(circuitJson)}</pre>
    </div>
  ),
}))

test("RunFrame shares initialization, serializes rendering and recovers failed or superseded runs", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "http://localhost",
    pretendToBeVisual: true,
  })
  const globals = [
    "window",
    "document",
    "Element",
    "HTMLElement",
    "Node",
    "Event",
    "MouseEvent",
    "MutationObserver",
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
  ] as const
  const previous = Object.fromEntries(
    globals.map((key) => [key, (globalThis as any)[key]]),
  )
  const previousFetch = globalThis.fetch
  const previousWorker = globalThis.runFrameWorker
  Object.assign(
    globalThis,
    Object.fromEntries(globals.map((key) => [key, (dom.window as any)[key]])),
    { IS_REACT_ACT_ENVIRONMENT: true, runFrameWorker: undefined },
  )
  const network = mock(() => {
    throw new Error("Local worker configuration must not discover versions")
  })
  globalThis.fetch = network as unknown as typeof fetch
  ;(dom.window as any).fetch = globalThis.fetch
  const root = createRoot(document.getElementById("root")!)
  let mounted = true
  try {
    const { RunFrame } = await import("../../lib/components/RunFrame/RunFrame")
    const onRunCompleted = mock(() => {})
    const onError = mock((_error: Error) => {})
    const waitForCompletion = async (expected: number) => {
      for (let attempt = 0; attempt < 50; attempt++) {
        if (onRunCompleted.mock.calls.length >= expected) return
        await act(async () => new Promise((resolve) => setTimeout(resolve, 10)))
      }
      expect(onRunCompleted).toHaveBeenCalledTimes(expected)
    }
    const circuitPlatformConfig = {
      projectBaseUrl: "http://localhost/project",
      enablePartOrientationAnalysis: false,
    }
    const platformConfig = {
      ...circuitPlatformConfig,
      telemetryDisabled: true,
      evalCdnLoadingDisabled: true,
      evalVersionSelectionDisabled: true,
      pcbRenderer: "canvas" as const,
    }
    await act(async () =>
      root.render(
        <RunFrame
          fsMap={{}}
          mainComponentPath="board.tsx"
          isLoadingFiles
          evalVersion="0.0.1580"
          evalWebWorkerBlobUrl="/assets/eval-worker.js"
          platformConfig={platformConfig}
          showFileMenu={false}
        />,
      ),
    )
    expect(executeWithFsMap).not.toHaveBeenCalled()
    const render = (source: string) => (
      <RunFrame
        fsMap={{ "board.tsx": source }}
        mainComponentPath="board.tsx"
        evalVersion="0.0.1580"
        evalWebWorkerBlobUrl="/assets/eval-worker.js"
        platformConfig={platformConfig}
        showFileMenu={false}
        defaultActiveTab="errors"
        availableTabs={["errors"]}
        onRunCompleted={onRunCompleted}
        onError={onError}
      />
    )
    await act(async () => root.render(render("export default () => <board />")))
    await waitForCompletion(1)
    expect(onRunCompleted).toHaveBeenCalledTimes(1)
    expect(createWorker).toHaveBeenCalledTimes(1)
    for (const [options] of createWorker.mock.calls) {
      expect(options).toMatchObject({
        evalVersion: "0.0.1580",
        webWorkerBlobUrl: "/assets/eval-worker.js",
        platform: circuitPlatformConfig,
        projectConfig: circuitPlatformConfig,
        disableCdnLoading: true,
      })
      expect((options as { platform: unknown }).platform).toEqual(
        circuitPlatformConfig,
      )
    }
    expect(executeWithFsMap).toHaveBeenCalledWith({
      entrypoint: undefined,
      mainComponentPath: "board.tsx",
      fsMap: { "board.tsx": "export default () => <board />" },
    })
    expect(worker.on).toHaveBeenCalledWith(
      "asyncEffect:start",
      expect.any(Function),
    )
    expect(worker.renderUntilSettled).toHaveBeenCalledTimes(1)
    expect(worker.getCircuitJson).toHaveBeenCalledTimes(2)
    const initialWorkerCreations = createWorker.mock.calls.length

    await act(async () =>
      root.render(render("export default () => <board width={20} />")),
    )
    expect(onRunCompleted).toHaveBeenCalledTimes(2)
    expect(createWorker).toHaveBeenCalledTimes(initialWorkerCreations)
    expect(clearEventListeners).toHaveBeenCalledTimes(2)
    expect(executeWithFsMap).toHaveBeenLastCalledWith({
      entrypoint: undefined,
      mainComponentPath: "board.tsx",
      fsMap: { "board.tsx": "export default () => <board width={20} />" },
    })

    for (const stage of [
      "execute",
      "render",
      "initial-json",
      "final-json",
    ] as const) {
      const message = `Worker ${stage} failed locally`
      const completedBeforeFailure = onRunCompleted.mock.calls.length
      const errorsBeforeFailure = onError.mock.calls.length
      if (stage === "execute") {
        executeWithFsMap.mockImplementationOnce(async () => {
          throw new Error(message)
        })
      } else if (stage === "render") {
        worker.renderUntilSettled.mockImplementationOnce(async () => {
          throw new Error(message)
        })
        worker.getCircuitJson.mockImplementationOnce(async () => {
          // Settlement can reject before the first snapshot arrives.
          await new Promise((resolve) => setTimeout(resolve, 20))
          return []
        })
      } else {
        if (stage === "final-json") {
          worker.getCircuitJson.mockImplementationOnce(async () => [])
        }
        worker.getCircuitJson.mockImplementationOnce(async () => {
          throw new Error(message)
        })
      }

      await act(async () => root.render(render(`// failure: ${stage}`)))
      await waitForCompletion(completedBeforeFailure + 1)
      expect(onError).toHaveBeenCalledTimes(errorsBeforeFailure + 1)
      expect(onError.mock.calls.at(-1)?.[0].message).toBe(message)
      expect(onRunCompleted).toHaveBeenCalledTimes(completedBeforeFailure + 1)
      expect(onRunCompleted.mock.calls.at(-1)?.[0]).toMatchObject({
        hasExecutionError: true,
        errors: [{ message }],
      })
      expect(document.body.textContent).toContain(message)
      expect(document.querySelector("[data-circuit-json]")?.textContent).toBe(
        "null",
      )
      expect(
        document.querySelector("[data-running]")?.getAttribute("data-running"),
      ).toBe("false")

      await act(async () =>
        root.render(render(`export default () => <board name="${stage}" />`)),
      )
      expect(onRunCompleted).toHaveBeenCalledTimes(completedBeforeFailure + 2)
      expect(onRunCompleted.mock.calls.at(-1)?.[0]).toEqual({
        hasExecutionError: false,
      })
      expect(document.body.textContent).not.toContain(message)
      expect(document.body.textContent).toContain("No errors or warnings")
    }

    let finishIdenticalRender!: () => void
    worker.renderUntilSettled.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishIdenticalRender = resolve
        }),
    )
    const beforeIdenticalRender = onRunCompleted.mock.calls.length
    const pendingSource = 'export default () => <board name="pending" />'
    await act(async () => root.render(render(pendingSource)))
    // Parent rerenders can recreate the same file map during initial preview.
    await act(async () => root.render(render(pendingSource)))
    await act(async () => finishIdenticalRender())
    expect(onRunCompleted).toHaveBeenCalledTimes(beforeIdenticalRender + 1)

    let finishRejectedSnapshotRender!: () => void
    worker.renderUntilSettled.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishRejectedSnapshotRender = resolve
        }),
    )
    worker.getCircuitJson.mockImplementationOnce(async () => {
      throw new Error("Initial snapshot failed while render was pending")
    })
    const beforeRejectedSnapshot = executeWithFsMap.mock.calls.length
    const beforeSnapshotRecovery = onRunCompleted.mock.calls.length
    await act(async () =>
      root.render(render("// snapshot failure still settling")),
    )
    await act(async () =>
      root.render(render('export default () => <board name="next" />')),
    )
    expect(executeWithFsMap).toHaveBeenCalledTimes(beforeRejectedSnapshot + 1)
    await act(async () => finishRejectedSnapshotRender())
    expect(executeWithFsMap).toHaveBeenCalledTimes(beforeRejectedSnapshot + 2)
    expect(onRunCompleted).toHaveBeenCalledTimes(beforeSnapshotRecovery + 1)

    let rejectStaleRender!: (error: Error) => void
    worker.renderUntilSettled.mockImplementationOnce(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectStaleRender = reject
        }),
    )
    const completedBeforeCancellation = onRunCompleted.mock.calls.length
    const errorsBeforeCancellation = onError.mock.calls.length
    await act(async () => root.render(render("// render still pending")))
    await act(async () =>
      root.render(render('export default () => <board name="recovered" />')),
    )
    await act(async () => rejectStaleRender(new Error("Stale render failed")))
    expect(onError).toHaveBeenCalledTimes(errorsBeforeCancellation)
    expect(onRunCompleted).toHaveBeenCalledTimes(
      completedBeforeCancellation + 1,
    )
    expect(document.body.textContent).not.toContain("Stale render failed")
    let finishBeforeLoading!: () => void
    worker.renderUntilSettled.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishBeforeLoading = resolve
        }),
    )
    const executionsBeforeLoading = executeWithFsMap.mock.calls.length
    const completedBeforeLoading = onRunCompleted.mock.calls.length
    await act(async () => root.render(render("// active before files reload")))
    await act(async () => root.render(render("// queued before files reload")))
    await act(async () =>
      root.render(
        cloneElement(render("// queued before files reload"), {
          isLoadingFiles: true,
        }),
      ),
    )
    await act(async () => finishBeforeLoading())
    expect(executeWithFsMap).toHaveBeenCalledTimes(executionsBeforeLoading + 1)
    expect(onRunCompleted).toHaveBeenCalledTimes(completedBeforeLoading)
    expect(document.querySelector("[data-circuit-json]")).toBeNull()
    await act(async () => root.render(render("// files reload complete")))
    expect(onRunCompleted).toHaveBeenCalledTimes(completedBeforeLoading + 1)

    const completedBeforeUnmount = onRunCompleted.mock.calls.length
    const errorsBeforeUnmount = onError.mock.calls.length
    globalThis.runFrameWorker = undefined
    await act(async () =>
      root.render(
        cloneElement(render("// initialization still pending"), {
          key: "pending",
        }),
      ),
    )
    await act(async () => root.unmount())
    mounted = false
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(globalThis.runFrameWorker).toBeUndefined()
    expect(worker.kill).toHaveBeenCalledTimes(1)
    expect(onRunCompleted).toHaveBeenCalledTimes(completedBeforeUnmount)
    expect(onError).toHaveBeenCalledTimes(errorsBeforeUnmount)
    expect(network).not.toHaveBeenCalled()
  } finally {
    if (mounted) await act(async () => root.unmount())
    globalThis.fetch = previousFetch
    Object.assign(globalThis, previous, {
      IS_REACT_ACT_ENVIRONMENT: false,
      runFrameWorker: previousWorker,
    })
    dom.window.close()
  }
})
