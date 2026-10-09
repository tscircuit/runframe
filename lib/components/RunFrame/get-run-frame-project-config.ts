import type { PlatformConfig } from "@tscircuit/props"

export const getRunFrameProjectConfig = ({
  projectBaseUrl,
  enablePartOrientationAnalysis,
}: {
  projectBaseUrl: string
  enablePartOrientationAnalysis?: boolean
}): Partial<PlatformConfig> => ({
  projectBaseUrl,
  enablePartOrientationAnalysis: enablePartOrientationAnalysis ?? true,
})
