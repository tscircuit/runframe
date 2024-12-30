import { useEffect, useRef } from "react"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import type { RunFrameEvent } from "../RunFrameWithApi/types"

export const useEventHandler = (callback: (event: RunFrameEvent) => void) => {
  const lastProcessedEventId = useRef<string | null>(null)
  const recentEvents = useRunFrameStore((state) => state.recentEvents)

  useEffect(() => {
    if (recentEvents.length === 0) return

    const latestEvent = recentEvents[0]

    if (latestEvent.event_id !== lastProcessedEventId.current) {
      callback(latestEvent)
      lastProcessedEventId.current = latestEvent.event_id
    }
  }, [recentEvents, callback])
}
