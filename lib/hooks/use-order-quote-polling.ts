import type { OrderQuote } from "@tscircuit/fake-snippets/schema"
import { registryKy } from "lib/utils/get-registry-ky"
import { useEffect, useRef, useState } from "react"
import { useCallback } from "react"

type PollingState = {
  status: "idle" | "loading" | "success" | "error"
  data: OrderQuote | null
  error: Error | null
}

export const useOrderQuotePolling = (packageReleaseId: string) => {
  const [state, setState] = useState<PollingState>({
    status: "idle",
    data: null,
    error: null,
  })
  const abortControllerRef = useRef<AbortController | null>(null)

  const createOrderQuotes = useCallback(async () => {
    const { order_quote_id } = await registryKy
      .post("order_quotes/create", {
        json: {
          package_release_id: packageReleaseId,
          vendor_name: "jlcpcb", // TODO: Remove this once we have more vendor
        },
      })
      .json<{ order_quote_id: string }>()
    return order_quote_id
  }, [packageReleaseId])

  const getOrderQuotes = useCallback(async (orderQuoteId: string) => {
    const { order_quote } = await registryKy
      .get(`order_quotes/get`, {
        searchParams: {
          order_quote_id: orderQuoteId,
        },
      })
      .json<{ order_quote: OrderQuote }>()
    return order_quote
  }, [])

  const startPolling = useCallback(async () => {
    setState((prev) => ({ ...prev, status: "loading", error: null }))

    try {
      const orderQuoteId = await createOrderQuotes()
      if (!orderQuoteId) {
        throw new Error("Failed to create order quote")
      }

      abortControllerRef.current = new AbortController()
      const controller = abortControllerRef.current

      const poll = async (maxAttempts = 20) => {
        let attempts = 0

        while (attempts < maxAttempts) {
          if (controller.signal.aborted) {
            throw new Error("Polling aborted")
          }

          try {
            const orderQuote = await getOrderQuotes(orderQuoteId)

            if (orderQuote.is_completed) {
              setState({
                status: "success",
                data: orderQuote,
                error: null,
              })
              return orderQuote
            }

            if (orderQuote.has_error) {
              throw new Error(orderQuote.error?.message ?? "Unknown error")
            }

            attempts++
            await new Promise((resolve) => {
              const timeoutId = setTimeout(resolve, 4000)
              controller.signal.addEventListener("abort", () => {
                clearTimeout(timeoutId)
                resolve(null)
              })
            })
          } catch (error) {
            if (error instanceof Error && error.message === "Polling aborted") {
              throw error
            }
            attempts++
            console.error("Error polling order quote:", error)
            await new Promise((resolve) => {
              const timeoutId = setTimeout(resolve, 4000)
              controller.signal.addEventListener("abort", () => {
                clearTimeout(timeoutId)
                resolve(null)
              })
            })
          }
        }

        throw new Error("Polling timed out after maximum attempts")
      }

      await poll()
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error : new Error("Unknown error"),
      }))
    }
  }, [createOrderQuotes, getOrderQuotes])

  const stopPolling = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  useEffect(() => {
    startPolling()
    return () => stopPolling()
  }, [startPolling, stopPolling])

  return {
    ...state,
    stopPolling,
  }
}
