export type RunframeConfig = {
  autorun?: boolean
  delayFileUploads?: boolean
}

function boolFromEnv(val: any): boolean | undefined {
  if (val === undefined || val === null) return undefined
  if (typeof val === "boolean") return val
  if (typeof val === "string") {
    const s = val.toLowerCase().trim()
    if (s === "1" || s === "true" || s === "yes") return true
    if (s === "0" || s === "false" || s === "no") return false
  }
  return undefined
}

export function resolveRunframeConfig(
  overrides?: Partial<RunframeConfig>,
): RunframeConfig {
  const win = typeof window !== "undefined" ? (window as any) : {}
  const env =
    typeof process !== "undefined" && (process as any).env
      ? (process as any).env
      : {}

  const autorun =
    overrides?.autorun ??
    win.__RUNFRAME_AUTORUN__ ??
    boolFromEnv(env.RUNFRAME_AUTORUN)
  const delayFileUploads =
    overrides?.delayFileUploads ??
    win.__DELAY_FILE_UPLOADS__ ??
    boolFromEnv(env.DELAY_FILE_UPLOADS)

  return {
    autorun: !!autorun,
    delayFileUploads: !!delayFileUploads,
  }
}

export default resolveRunframeConfig
