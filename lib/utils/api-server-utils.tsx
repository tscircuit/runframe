import React from "react"

/**
 * Checks if the local API server should be available
 * Returns true if running locally (not on Vercel deployment)
 */
export function isLocalApiServerAvailable(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  // API server is NOT available on Vercel deployments
  return !window.location.origin.includes("vercel.app")
}

/**
 * Returns JSX for the "API not available" warning message
 */
export function getApiNotAvailableMessage() {
  return (
    <div>
      <h1>RunFrame with API</h1>
      <p>
        We don't currently deploy the API to vercel, try locally! The vite
        plugin will automatically load it.
      </p>
    </div>
  )
}
