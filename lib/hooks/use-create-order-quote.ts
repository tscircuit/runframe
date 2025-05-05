import { useMutation } from "react-query"
import type { UseMutationResult } from "react-query"
import { createOrderQuote } from "lib/api/order-quotes"

export const useCreateOrderQuote = (
  packageReleaseId: string,
): UseMutationResult<string | undefined, Error, void> => {
  return useMutation({
    mutationFn: async () => {
      try {
        return await createOrderQuote(packageReleaseId)
      } catch (error) {
        console.error("Error creating order quote:", error)
        throw error instanceof Error
          ? error
          : new Error("Failed to create order quote")
      }
    },
  })
}
