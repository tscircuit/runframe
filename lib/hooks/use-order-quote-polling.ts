import { useQuery } from "react-query"
import { getOrderQuote } from "lib/api/order-quotes"

export const useOrderQuotePolling = (orderQuoteId: string | undefined) => {
  const {
    data: orderQuote,
    error,
    status,
  } = useQuery(
    ["getOrderQuote", orderQuoteId],
    () => getOrderQuote(orderQuoteId || ""),
    {
      enabled: !!orderQuoteId,
      refetchInterval: (data) => {
        // Stop polling if the quote is completed or has an error
        if (data?.is_completed || data?.has_error) {
          return false
        }
        return 4000 // Poll every 4 seconds
      },
      refetchIntervalInBackground: true,
      retry: false,
    },
  )

  return {
    status:
      status === "loading"
        ? "loading"
        : status === "error"
          ? "error"
          : "success",
    data: orderQuote ?? null,
    error: error instanceof Error ? error : null,
  }
}
