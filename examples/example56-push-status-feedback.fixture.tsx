import { FileMenuLeftHeader } from "lib/components/FileMenuLeftHeader"
import { useRunFrameStore } from "lib/components/RunFrameWithApi/store"
import type {
  RunFrameEvent,
  RunFrameEventInput,
} from "lib/components/RunFrameWithApi/types"
import { useEffect } from "react"

const addEvent = (event: RunFrameEventInput) => {
  useRunFrameStore.setState((state) => ({
    recentEvents: [
      {
        ...event,
        event_id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      } as RunFrameEvent,
      ...state.recentEvents,
    ],
  }))
}

export default () => {
  useEffect(() => {
    const originalPushEvent = useRunFrameStore.getState().pushEvent

    useRunFrameStore.setState({
      pushEvent: async (event) => {
        if (event.event_type !== "REQUEST_TO_SAVE_SNIPPET") return

        await new Promise((resolve) => setTimeout(resolve, 500))

        if (!event.snippet_name) {
          addEvent({
            event_type: "FAILED_TO_SAVE_SNIPPET",
            error_code: "SNIPPET_UNSET",
            available_snippet_names: ["push-success", "push-failure"],
          })
          return
        }

        if (event.snippet_name === "push-failure") {
          addEvent({
            event_type: "FAILED_TO_SAVE_SNIPPET",
            error_code: "SERVER_ERROR",
            message: "The registry rejected this snippet.",
          })
          return
        }

        addEvent({ event_type: "SNIPPET_SAVED" })
      },
    })

    return () => useRunFrameStore.setState({ pushEvent: originalPushEvent })
  }, [])

  return <FileMenuLeftHeader isWebEmbedded={false} />
}
