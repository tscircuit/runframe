import { useState, useEffect } from "react"

/**
 * A hook that works like useState but also saves/loads from local storage
 * @param key The key to use for local storage
 * @param initialValue The initial value to use if no value is found in local storage
 * @returns A tuple of [state, setState] just like useState
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Get the initial value from local storage or use the provided initialValue
  const [state, setState] = useState<T>(() => {
    try {
      // Try to get the value from local storage
      const item = window.localStorage.getItem(key)
      // Return the parsed value if it exists, otherwise return initialValue
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // If there's an error (e.g., parsing error), return initialValue
      console.error("Error reading from localStorage:", error)
      return initialValue
    }
  })

  // Update local storage when the state changes
  useEffect(() => {
    try {
      // Save the state to local storage
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch (error) {
      console.error("Error writing to localStorage:", error)
    }
  }, [key, state])

  return [state, setState]
}
