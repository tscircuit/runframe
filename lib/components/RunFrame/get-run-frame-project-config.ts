import type { PlatformConfig } from "@tscircuit/props"

export const getRunFrameProjectConfig = ({
  platformConfig,
  projectBaseUrl,
}: {
  platformConfig?: PlatformConfig
  projectBaseUrl: string
}): Partial<PlatformConfig> => ({
  ...platformConfig,
  projectBaseUrl,
  enablePartOrientationAnalysis: true,
})
