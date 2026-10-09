import type { RunFrameRuntime } from "./types"

/** The offline build aliases default-runtime to this module. */
export const getDefaultRuntime = (): RunFrameRuntime => {
  throw new Error(
    "The offline entrypoint requires a RunFrameRuntimeProvider or runtime prop.",
  )
}
