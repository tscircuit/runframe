import { useCallback, useRef } from "react"

export function useMutex() {
  const lockRef = useRef<Promise<void>>(Promise.resolve())
  const isLockedRef = useRef(false)

  const runWithMutex = useCallback(
    async (fn: () => Promise<any>): Promise<void> => {
      // Wait for any previous execution to complete
      await lockRef.current

      // Create a new promise for this execution
      let releaseLock: () => void
      const newLock = new Promise<void>((resolve) => {
        releaseLock = resolve
      })

      try {
        // Set the new lock
        lockRef.current = newLock
        isLockedRef.current = true

        // Execute the function
        return await fn()
      } finally {
        // Release the lock
        isLockedRef.current = false
        releaseLock!()
      }
    },
    [],
  )

  const isLocked = useCallback(() => isLockedRef.current, [])

  return { runWithMutex, isLocked }
}
