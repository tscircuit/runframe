import { RunFrameForCli } from "lib/components/RunFrameForCli/RunFrameForCli"
import { useEventHandler } from "lib/components/RunFrameForCli/useEventHandler"
import { useRunFrameStore } from "lib/components/RunFrameWithApi/store"

export default () => {
  const pushEvent = useRunFrameStore((state) => state.pushEvent)

  useEventHandler(async (event) => {
    if (event.event_type !== "REQUEST_TO_SAVE_SNIPPET") return

    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (!event.snippet_name) {
      pushEvent({
        event_type: "FAILED_TO_SAVE_SNIPPET",
        error_code: "SNIPPET_UNSET",
        available_snippet_names: ["push-success", "push-failure"],
      })
      return
    }

    if (event.snippet_name === "push-failure") {
      pushEvent({
        event_type: "FAILED_TO_SAVE_SNIPPET",
        message: "The registry rejected this snippet.",
      })
      return
    }

    pushEvent({ event_type: "SNIPPET_SAVED" })
  })

  return <RunFrameForCli debug />
}
