import { useMutation, type UseMutationResult } from "react-query"
import { createOrderQuote, type OrderQuoteError } from "lib/api/order-quotes"
import { useQueryClient } from "react-query"

export const useCreateOrderQuote = (): UseMutationResult<
  { order_quote_id: string },
  OrderQuoteError,
  string
> => {
  const queryClient = useQueryClient()

  return useMutation<{ order_quote_id: string }, OrderQuoteError, string>({
    mutationKey: ["createOrderQuote"],
    mutationFn: (packageReleaseId: string) => createOrderQuote(packageReleaseId),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getOrderQuote", data.order_quote_id])
    },
  })
}
