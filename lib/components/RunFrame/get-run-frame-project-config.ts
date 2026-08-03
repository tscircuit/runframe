import type { PlatformConfig } from "@tscircuit/props"

export const getRunFrameProjectConfig = ({
  projectBaseUrl,
}: {
  projectBaseUrl: string
}): Partial<PlatformConfig> => ({
  projectBaseUrl,
  enablePartOrientationAnalysis: true,
})
