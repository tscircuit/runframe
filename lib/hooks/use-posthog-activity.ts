import { useEffect } from "react"
import {
  captureRunFrameActivity,
  type RunFrameActivityProperties,
} from "lib/utils/posthog"

export const usePostHogActivity = (properties: RunFrameActivityProperties) => {
  useEffect(() => {
    try {
      captureRunFrameActivity(properties)
    } catch {
      // Analytics should never affect rendering.
    }
  }, [
    properties.source,
    properties.component,
    properties.isWebEmbedded,
    properties.activeTab,
  ])
}
