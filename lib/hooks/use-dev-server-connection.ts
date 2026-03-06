import { API_BASE } from "lib/components/RunFrameWithApi/api-base"
import { useEffect, useState } from "react"

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"])
const POLL_INTERVAL_MS = 5000
const REQUEST_TIMEOUT_MS = 2500

export type DevServerConnectionStatus = "connected" | "disconnected" | "hidden"

export const isLocalhost = (host?: string): boolean => {
  if (!host) return false
  return LOCAL_HOSTS.has(host.toLowerCase())
}

export const checkDevServerConnection = async (
  apiBase: string,
): Promise<boolean> => {
  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  )

  try {
    await fetch(`${apiBase}/events/list`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    })

    return true
  } catch {
    return false
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}

export const useDevServerConnectionStatus = (): DevServerConnectionStatus => {
  const [status, setStatus] = useState<DevServerConnectionStatus>("hidden")

  useEffect(() => {
    if (typeof window === "undefined") {
      setStatus("hidden")
      return
    }

    if (!isLocalhost(window.location.hostname)) {
      setStatus("hidden")
      return
    }

    let cancelled = false

    const pollConnection = async () => {
      const connected = await checkDevServerConnection(API_BASE)

      if (!cancelled) {
        setStatus(connected ? "connected" : "disconnected")
      }
    }

    setStatus("disconnected")
    pollConnection()

    const intervalId = window.setInterval(pollConnection, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [])

  return status
}
