import { useEffect } from "react"
import { RunFrame } from "../RunFrame"
import { useRunFrameStore, selectCurrentFileMap } from "./store"
import type { RunFrameWithApiProps } from "./types"

const guessEntrypoint = (files: string[]) =>
  files.find((file) => file.endsWith(".tsx"))

export const RunFrameWithApi = ({ apiBaseUrl }: RunFrameWithApiProps) => {
  const { startPolling, stopPolling } = useRunFrameStore()
  const fsMap = useRunFrameStore(selectCurrentFileMap)

  // Initialize API base URL
  useEffect(() => {
    if (apiBaseUrl) {
      window.API_BASE_URL = apiBaseUrl
    }
  }, [apiBaseUrl])

  // Start/stop polling
  useEffect(() => {
    startPolling()
    return () => stopPolling()
  }, [startPolling, stopPolling])

  const entrypoint = guessEntrypoint(Object.keys(fsMap))

  if (!entrypoint) {
    return <div>No entrypoint found for Run Frame!</div>
  }

  return (
    <RunFrame
      fsMap={fsMap}
      entrypoint={entrypoint}
      onError={(error) => {
        console.error("RunFrame error:", error)
      }}
    />
  )
}
