import { useState, useEffect } from "react"
import { useRunFrameStore } from "lib/components/RunFrameWithApi/store"
import { API_BASE } from "lib/components/RunFrameWithApi/api-base"
import Debug from "debug"

const debug = Debug("run-frame:useHasReceivedInitialFilesLoaded")

export const useHasReceivedInitialFilesLoaded = () => {
  const [hasReceived, setHasReceived] = useState(false)
  const { recentEvents, loadInitialFiles } = useRunFrameStore((s) => ({
    recentEvents: s.recentEvents,
    loadInitialFiles: s.loadInitialFiles,
  }))

  useEffect(() => {
    const initialize = async () => {
      await loadInitialFiles()

      try {
        const res = await fetch(
          `${API_BASE}/events/list?event_type=INITIAL_FILES_UPLOADED`,
        )
        if (res.ok) {
          const { event_list } = await res.json()
          if (event_list.length > 0) {
            debug("INITIAL_FILES_UPLOADED found in history. Assuming ready.")
            setHasReceived(true)
            return
          }
        }
      } catch (e) {
        console.error("Failed to check for event history", e)
      }
      debug("No INITIAL_FILES_UPLOADED in history, waiting for polling.")
    }

    initialize()
  }, [loadInitialFiles])

  useEffect(() => {
    if (hasReceived) return

    if (recentEvents.some((e) => e.event_type === "INITIAL_FILES_UPLOADED")) {
      debug("INITIAL_FILES_UPLOADED received via polling. Assuming ready.")
      setHasReceived(true)
    }
  }, [recentEvents, hasReceived])

  return hasReceived
}
