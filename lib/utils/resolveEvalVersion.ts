export async function resolveEvalVersion(
  evalVersion: string,
  forceLatest?: boolean,
) {
  if (!forceLatest && evalVersion !== "latest") return evalVersion

  if (!forceLatest && globalThis.runFrameEvalVersion) {
    return globalThis.runFrameEvalVersion
  }

  if (!globalThis.runFrameEvalVersionPromise) {
    globalThis.runFrameEvalVersionPromise = fetch(
      "https://data.jsdelivr.com/v1/package/npm/@tscircuit/eval",
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to fetch latest eval version")
        return (await response.json()).tags?.latest ?? "latest"
      })
      .catch((err) => {
        console.error("Failed to fetch latest eval version", err)
        return "latest"
      })
  }

  const latest = await globalThis.runFrameEvalVersionPromise
  globalThis.runFrameEvalVersionPromise = null
  if (latest && latest !== "latest") {
    globalThis.runFrameEvalVersion = latest
  }
  return latest
}
