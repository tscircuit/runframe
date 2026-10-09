import type { PlatformConfig } from "@tscircuit/props"

/** Circuit platform hooks and optional settings consumed by the preview UI. */
export interface RunFramePlatformConfig extends PlatformConfig {
  /** Skip activity/error telemetry. Omitted or false retains normal tracking. */
  telemetryDisabled?: boolean
  /** Use only dependencies supplied to the evaluator; disable CDN fallback. */
  evalCdnLoadingDisabled?: boolean
  /** Hide the version menu and skip its registry request. Pin evalVersion to
   * avoid latest-version discovery during worker creation. */
  evalVersionSelectionDisabled?: boolean
  /** Select the PCB viewer backend. Omitted uses the viewer's default. */
  pcbRenderer?: "webgpu" | "canvas"
}

/** Keep preview settings in the window rather than forwarding them to core. */
export const getCircuitPlatformConfig = (
  config: RunFramePlatformConfig | undefined,
): PlatformConfig | undefined => {
  if (!config) return undefined
  const {
    telemetryDisabled,
    evalCdnLoadingDisabled,
    evalVersionSelectionDisabled,
    pcbRenderer,
    ...circuitPlatform
  } = config
  return circuitPlatform
}
