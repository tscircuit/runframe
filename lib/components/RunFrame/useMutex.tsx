import { useCallback, useRef } from "react"

export function useMutex() {
  const lockRef = useRef<Promise<void>>(Promise.resolve())
  const isLockedRef = useRef(false)
  const currentExecutionRef = useRef<{ cancelled: boolean } | null>(null)

  const runWithMutex = useCallback(
    async (fn: () => Promise<any>): Promise<void> => {
      // Wait for any previous execution to complete
      await lockRef.current

      // Create execution context
      const executionContext = { cancelled: false }
      currentExecutionRef.current = executionContext

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
      } catch (error) {
        // If cancelled, don't propagate error
        if (!executionContext.cancelled) {
          throw error
        }
      } finally {
        // Release the lock
        isLockedRef.current = false
        currentExecutionRef.current = null
        releaseLock!()
      }
    },
    [],
  )

  const cancel = useCallback(() => {
    if (currentExecutionRef.current) {
      currentExecutionRef.current.cancelled = true
    }
    // Force release the current lock by resolving it
    lockRef.current = Promise.resolve()
    isLockedRef.current = false
  }, [])

  const isLocked = useCallback(() => isLockedRef.current, [])

  return { runWithMutex, isLocked, cancel }
}
