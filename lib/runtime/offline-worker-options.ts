import type { RunFrameRuntime } from "./types"

export const getOfflineWorkerOptions = (
  runtime: RunFrameRuntime,
  props: { evalVersion?: string; evalWebWorkerBlobUrl?: string },
) => {
  const evalVersion = runtime.evalVersion ?? props.evalVersion
  const workerUrl = runtime.workerUrl ?? props.evalWebWorkerBlobUrl
  if (!evalVersion || evalVersion === "latest" || !workerUrl) {
    throw new Error(
      "Offline execution requires a local worker URL and its exact evalVersion. No evaluator will be downloaded.",
    )
  }
  if (
    runtime.evalVersion &&
    props.evalVersion &&
    runtime.evalVersion !== props.evalVersion
  ) {
    throw new Error(
      "The requested evaluator version is not included in this offline runtime.",
    )
  }
  const url = new URL(workerUrl, globalThis.location?.href)
  if (
    !globalThis.location ||
    url.origin !== globalThis.location.origin ||
    !["http:", "https:", "blob:"].includes(url.protocol)
  ) {
    throw new Error(
      "The offline worker must be served from the local application origin.",
    )
  }
  return { evalVersion, webWorkerBlobUrl: url.href, disableCdnLoading: true }
}
