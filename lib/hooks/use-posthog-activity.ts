import { useRunFrameRuntime } from "lib/runtime/context"
import { useEffect } from "react"
import {
  captureRunFrameActivity,
  type RunFrameActivityProperties,
} from "lib/utils/posthog"

export const usePostHogActivity = (properties: RunFrameActivityProperties) => {
  const runtime = useRunFrameRuntime()
  useEffect(() => {
    if (runtime.mode === "offline") return
    try {
      captureRunFrameActivity(properties)
    } catch {
      // Analytics should never affect rendering.
    }
  }, [
    runtime,
    properties.source,
    properties.component,
    properties.isWebEmbedded,
    properties.activeTab,
  ])
}
