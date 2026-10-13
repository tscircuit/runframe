import type { PlatformConfig } from "@tscircuit/props"
import { getPlatformImporter } from "lib/utils/get-platform-importer"

export const getStepConverter = async (platformConfig?: PlatformConfig) => {
  if (
    platformConfig?.jscdnBaseUrl !== undefined ||
    platformConfig?.platformFetch
  ) {
    return getPlatformImporter(platformConfig)(
      "circuit-json-to-step",
    ) as Promise<typeof import("circuit-json-to-step")>
  }
  // Preserve the bundled converter for hosts without custom module transport.
  return await import("circuit-json-to-step")
}
