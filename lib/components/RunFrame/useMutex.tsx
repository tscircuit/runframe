import { useRef } from "react"
import { LatestTaskQueue } from "lib/utils/latest-task-queue"

export function useMutex() {
  const queue = useRef(new LatestTaskQueue()).current
  return {
    runWithMutex: queue.run,
    isLocked: queue.isLocked,
    cancel: queue.cancel,
  }
}
