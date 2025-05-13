import { useMutation } from "react-query"
import type { UseMutationResult } from "react-query"
import { createOrderQuote, type OrderQuoteError } from "lib/api/order-quotes"

export const useCreateOrderQuote = (
  packageReleaseId: string,
): UseMutationResult<string | undefined, OrderQuoteError, void> => {
  return useMutation({
    mutationFn: async () => {
      return await createOrderQuote(packageReleaseId)
    },
  })
}
